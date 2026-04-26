import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
const env = Object.fromEntries(envFile.split('\n').map(line => line.split('=')));

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function check() {
  console.log('--- TASKS ---');
  const { data: tasks } = await supabase.from('tasks').select('*');
  console.log(tasks);

  console.log('\n--- SUBMISSIONS ---');
  const { data: subs, error: subsErr } = await supabase.from('submissions').select('*, tasks!inner(*)');
  console.log(subs);
  if (subsErr) console.error('Error:', subsErr);

  console.log('\n--- ACTIVITY ---');
  const { data: acts } = await supabase.from('activity').select('*');
  console.log(acts);
}

check();
