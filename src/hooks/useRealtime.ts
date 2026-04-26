import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

/* ──────────────────────────────────────────────
   ADMIN — watches submissions, profiles, tasks
   ────────────────────────────────────────────── */
export function useRealtimeAdmin(
  orgId: string | null | undefined,
  callbacks: {
    onNewSubmission?: () => void;
    onProfileUpdate?: () => void;
    onTaskUpdate?: () => void;
  },
) {
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  useEffect(() => {
    if (!orgId) return;

    // Channel 1: submissions
    const subChannel = supabase
      .channel('admin-subs-' + orgId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'submissions' },
        async (payload) => {
          const { data: prof } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', payload.new.ambassador_id)
            .single();
          const { data: task } = await supabase
            .from('tasks')
            .select('title')
            .eq('id', payload.new.task_id)
            .single();
          toast(
            `📬 ${prof?.full_name ?? 'An ambassador'} submitted proof for "${task?.title ?? 'a task'}"`,
            { icon: '🔔', duration: 5000 },
          );
          cbRef.current.onNewSubmission?.();
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'submissions' },
        () => cbRef.current.onNewSubmission?.(),
      )
      .subscribe();

    // Channel 2: profiles (point changes / leaderboard)
    const profChannel = supabase
      .channel('admin-profiles-' + orgId)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        () => cbRef.current.onProfileUpdate?.(),
      )
      .subscribe();

    // Channel 3: tasks (multi-admin)
    const taskChannel = supabase
      .channel('admin-tasks-' + orgId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => cbRef.current.onTaskUpdate?.(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subChannel);
      supabase.removeChannel(profChannel);
      supabase.removeChannel(taskChannel);
    };
  }, [orgId]);
}

/* ──────────────────────────────────────────────
   AMBASSADOR — watches tasks, own submissions,
   own profile, and leaderboard profiles
   ────────────────────────────────────────────── */
export function useRealtimeAmbassador(
  ambassadorId: string | null | undefined,
  orgId: string | null | undefined,
  callbacks: {
    onNewTask?: () => void;
    onSubmissionReviewed?: () => void;
    onPointsUpdate?: (newPoints: number) => void;
    onLeaderboardChange?: () => void;
  },
) {
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  useEffect(() => {
    if (!ambassadorId || !orgId) return;

    // Channel 1: new tasks from admin
    const taskChannel = supabase
      .channel('amb-tasks-' + orgId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tasks', filter: `org_id=eq.${orgId}` },
        (payload) => {
          toast.success(
            `🎯 New task: "${payload.new.title}" — ${payload.new.points} pts!`,
            { duration: 6000, icon: '✨' },
          );
          cbRef.current.onNewTask?.();
        },
      )
      .subscribe();

    // Channel 2: own submissions reviewed
    const subChannel = supabase
      .channel('amb-subs-' + ambassadorId)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'submissions',
          filter: `ambassador_id=eq.${ambassadorId}`,
        },
        (payload) => {
          if (payload.new.status === 'approved') {
            toast.success(
              `🎉 Approved! +${payload.new.points_awarded} points earned!`,
              { duration: 7000 },
            );
          } else if (payload.new.status === 'rejected') {
            toast.error('❌ Submission rejected. Check feedback and try again.', {
              duration: 6000,
            });
          }
          cbRef.current.onSubmissionReviewed?.();
        },
      )
      .subscribe();

    // Channel 3: own profile (points live update)
    const profChannel = supabase
      .channel('amb-profile-' + ambassadorId)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${ambassadorId}`,
        },
        (payload) => {
          cbRef.current.onPointsUpdate?.(payload.new.points);
        },
      )
      .subscribe();

    // Channel 4: all profiles → leaderboard
    const lbChannel = supabase
      .channel('amb-lb-' + orgId)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        () => cbRef.current.onLeaderboardChange?.(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(taskChannel);
      supabase.removeChannel(subChannel);
      supabase.removeChannel(profChannel);
      supabase.removeChannel(lbChannel);
    };
  }, [ambassadorId, orgId]);
}
