import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import type { Profile, Organization, UserRole } from '../types';

export function useAuth() {
  const { setProfile, setOrg, clearSession, setAuthLoading } = useAppStore();

  async function signUp(
    email: string,
    password: string,
    fullName: string,
    college: string,
    role: UserRole,
    orgName: string,
  ): Promise<{ error: string | null }> {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError || !authData.user) return { error: authError?.message ?? 'Sign up failed' };

    // Ensure session is active before touching DB
    let userId = authData.user.id;
    if (!authData.session) {
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) return { error: 'Account created — please sign in to continue. (Check your email if confirmation is required)' };
      if (signInData.user) {
        userId = signInData.user.id;
      }
    }

    // Resolve org via SECURITY DEFINER RPC (bypasses RLS)
    let orgId: string | null = null;
    if (role === 'admin') {
      const { data: id, error: orgErr } = await supabase.rpc('upsert_organization', {
        p_name: orgName,
        p_email: email,
      });
      if (orgErr) return { error: orgErr.message };
      orgId = id as string;
    } else {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .ilike('name', orgName)
        .maybeSingle();
      if (!orgData) return { error: `No organisation found named "${orgName}". Ask your admin for the exact name.` };
      orgId = orgData.id;
    }

    // Create profile via SECURITY DEFINER RPC (bypasses RLS)
    const { error: profileErr } = await supabase.rpc('upsert_profile', {
      p_id: userId,
      p_full_name: fullName,
      p_college: college || null,
      p_role: role,
      p_org_id: orgId,
    });
    if (profileErr) return { error: profileErr.message };

    // Load into store
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (profile) setProfile(profile as Profile);

    if (orgId) {
      const { data: org } = await supabase.from('organizations').select('*').eq('id', orgId).single();
      if (org) setOrg(org as Organization);
    }

    return { error: null };
  }

  async function signIn(email: string, password: string): Promise<{ error: string | null; role?: UserRole }> {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !authData.user) return { error: authError?.message ?? 'Sign in failed' };

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    if (profileError || !profile) return { error: 'Profile not found. Please register first.' };

    setProfile(profile as Profile);

    if ((profile as Profile).org_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', (profile as Profile).org_id)
        .single();
      if (org) setOrg(org as Organization);
    }

    return { error: null, role: (profile as Profile).role };
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut();
    clearSession();
  }

  async function getSession(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setAuthLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
      
    if (!profile) {
      setAuthLoading(false);
      return;
    }

    setProfile(profile as Profile);

    if ((profile as Profile).org_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', (profile as Profile).org_id)
        .single();
      if (org) setOrg(org as Organization);
    }
    
    setAuthLoading(false);
  }

  return { signUp, signIn, signOut, getSession };
}
