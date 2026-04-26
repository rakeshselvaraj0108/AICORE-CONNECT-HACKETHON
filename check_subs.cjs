const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
const env = Object.fromEntries(envFile.split('\n').filter(line => line.includes('=')).map(line => line.split('=')));

const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

async function check() {
  const { data: orgs } = await supabase.from('organizations').select('*');
  console.log('ORGS:', orgs);
  
  if (orgs.length === 0) return;
  const orgId = orgs[0].id;
  
  const { data: subs, error } = await supabase
      .from('submissions')
      .select('*, profiles!submissions_ambassador_id_fkey(*), tasks!inner(*)')
      .eq('tasks.org_id', orgId)
      .order('submitted_at', { ascending: false });
      
  console.log('SUBS ERROR:', error);
  console.log('SUBS:', subs);
}
check();
