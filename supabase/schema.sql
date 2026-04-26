-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ORGANIZATIONS table
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  logo_url text,
  created_at timestamptz default now()
);

-- PROFILES table (extends Supabase auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  college text,
  role text not null check (role in ('admin','ambassador')),
  org_id uuid references organizations(id),
  points integer default 0,
  streak integer default 0,
  last_active_date date,
  avatar_url text,
  created_at timestamptz default now()
);

-- TASKS table
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade,
  created_by uuid references profiles(id),
  title text not null,
  description text not null,
  task_type text not null check (
    task_type in ('Referral','Content Creation','Social Media','Event Promotion','Survey')
  ),
  points integer not null default 100,
  deadline date not null,
  is_active boolean default true,
  assignment_type text default 'global' check (assignment_type in ('global', 'specific')),
  created_at timestamptz default now()
);

-- TASK ASSIGNMENTS junction table
create table task_assignments (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references tasks(id) on delete cascade,
  ambassador_id uuid references profiles(id) on delete cascade,
  assigned_at timestamptz default now(),
  assigned_by uuid references profiles(id),
  unique(task_id, ambassador_id)
);

-- SUBMISSIONS table
create table submissions (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references tasks(id) on delete cascade,
  ambassador_id uuid references profiles(id) on delete cascade,
  proof_url text not null,
  notes text,
  status text default 'pending' check (status in ('pending','approved','rejected')),
  ai_score integer,
  ai_feedback text,
  ai_approval_likelihood text check (ai_approval_likelihood in ('High','Medium','Low')),
  points_awarded integer default 0,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  submitted_at timestamptz default now()
);

-- BADGES table
create table badges (
  id uuid primary key default uuid_generate_v4(),
  ambassador_id uuid references profiles(id) on delete cascade,
  badge_id text not null,
  badge_name text not null,
  earned_at timestamptz default now(),
  unique(ambassador_id, badge_id)
);

-- ACTIVITY table
create table activity (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id),
  actor_id uuid references profiles(id),
  text text not null,
  type text,
  created_at timestamptz default now()
);

-- ROW LEVEL SECURITY
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table tasks enable row level security;
alter table submissions enable row level security;
alter table badges enable row level security;
alter table activity enable row level security;
alter table task_assignments enable row level security;

-- ENABLE REALTIME
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table tasks, submissions, profiles;

-- RLS POLICIES
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

create policy "orgs_select" on organizations for select using (true);
create policy "orgs_insert" on organizations for insert with check (true);
create policy "orgs_update" on organizations for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin' and org_id = organizations.id)
);

create policy "tasks_select" on tasks for select using (true);
create policy "tasks_insert" on tasks for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "tasks_update" on tasks for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "submissions_select" on submissions for select using (true);
create policy "submissions_insert" on submissions for insert with check (auth.uid() = ambassador_id);
create policy "submissions_update" on submissions for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin') or auth.uid() = ambassador_id
);

create policy "badges_select" on badges for select using (true);
create policy "badges_insert" on badges for insert with check (true);

create policy "activity_select" on activity for select using (true);
create policy "activity_insert" on activity for insert with check (true);

create policy "task_assignments_select" on task_assignments for select using (true);
create policy "task_assignments_insert" on task_assignments for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- FUNCTION: Auto-update ambassador points after submission approved
create or replace function update_points_on_approval()
returns trigger as $$
begin
  if NEW.status = 'approved' and OLD.status = 'pending' then
    update profiles
    set points = points + NEW.points_awarded
    where id = NEW.ambassador_id;

    insert into activity (org_id, actor_id, text, type)
    select t.org_id, NEW.ambassador_id,
      p.full_name || ' earned ' || NEW.points_awarded || ' points for task approval!', 'points'
    from tasks t
    join profiles p on p.id = NEW.ambassador_id
    where t.id = NEW.task_id;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_submission_approved
  after update on submissions
  for each row execute function update_points_on_approval();

-- FUNCTION: Update streak when ambassador submits
create or replace function update_streak()
returns trigger as $$
begin
  update profiles set
    streak = case
      when last_active_date = current_date - 1 then streak + 1
      when last_active_date = current_date then streak
      else 1
    end,
    last_active_date = current_date
  where id = NEW.ambassador_id;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_submission_created
  after insert on submissions
  for each row execute function update_streak();

-- FUNCTION: Upsert Organization
create or replace function upsert_organization(p_email text, p_name text)
returns uuid as $$
declare
  v_org_id uuid;
begin
  insert into organizations (email, name)
  values (p_email, p_name)
  on conflict (email) do update set name = excluded.name
  returning id into v_org_id;
  
  return v_org_id;
end;
$$ language plpgsql security definer;

-- FUNCTION: Upsert Profile
create or replace function upsert_profile(p_id uuid, p_full_name text, p_college text, p_role text, p_org_id uuid)
returns void as $$
begin
  insert into profiles (id, full_name, college, role, org_id)
  values (p_id, p_full_name, p_college, p_role, p_org_id)
  on conflict (id) do update set
    full_name = excluded.full_name,
    college = excluded.college,
    role = excluded.role,
    org_id = excluded.org_id;
end;
$$ language plpgsql security definer;

-- STORAGE: Create proofs bucket for file uploads
insert into storage.buckets (id, name, public) values ('proofs', 'proofs', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload files
create policy "proofs_upload" on storage.objects for insert
  with check (bucket_id = 'proofs' and auth.role() = 'authenticated');

-- Allow public read access
create policy "proofs_read" on storage.objects for select
  using (bucket_id = 'proofs');
