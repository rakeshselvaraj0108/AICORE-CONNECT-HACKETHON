import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Submission, ApprovalLikelihood } from '../types';

export function useSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSubmissions = useCallback(async (orgId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('submissions')
      .select('*, profiles!submissions_ambassador_id_fkey(*), tasks!inner(*)')
      .eq('tasks.org_id', orgId)
      .order('submitted_at', { ascending: false });
    if (error) console.error('fetchSubmissions error:', error);
    if (!error && data) setSubmissions(data as Submission[]);
    setLoading(false);
    return (data as Submission[]) ?? [];
  }, []);

  const fetchMySubmissions = useCallback(async (ambassadorId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('submissions')
      .select('*, tasks(*)')
      .eq('ambassador_id', ambassadorId)
      .order('submitted_at', { ascending: false });
    if (error) console.error('fetchMySubmissions error:', error);
    if (!error && data) setSubmissions(data as Submission[]);
    setLoading(false);
    return (data as Submission[]) ?? [];
  }, []);

  const submitProof = useCallback(async (
    taskId: string,
    ambassadorId: string,
    proofUrl: string,
    notes: string,
    aiScore: number | null,
    aiFeedback: string | null,
    aiApprovalLikelihood: ApprovalLikelihood | null,
  ): Promise<{ error: string | null }> => {
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        task_id: taskId,
        ambassador_id: ambassadorId,
        proof_url: proofUrl,
        notes: notes || null,
        status: 'pending',
        ai_score: aiScore,
        ai_feedback: aiFeedback,
        ai_approval_likelihood: aiApprovalLikelihood,
      })
      .select('*, tasks(*)')
      .single();

    if (error) return { error: error.message };
    if (data) {
      setSubmissions((prev) => [data as Submission, ...prev]);
      const orgId = (data.tasks as any)?.org_id;
      if (orgId) {
        await supabase.from('activity').insert({
          org_id: orgId,
          actor_id: ambassadorId,
          text: `New proof submitted for review`,
          type: 'submission',
        });
      }
    }

    return { error: null };
  }, []);

  const approveSubmission = useCallback(async (
    submissionId: string,
    pointsToAward: number,
    reviewerId: string,
  ): Promise<{ error: string | null }> => {
    const { error } = await supabase
      .from('submissions')
      .update({
        status: 'approved',
        points_awarded: pointsToAward,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (error) return { error: error.message };
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? { ...s, status: 'approved', points_awarded: pointsToAward, reviewed_by: reviewerId, reviewed_at: new Date().toISOString() }
          : s,
      ),
    );
    return { error: null };
  }, []);

  const rejectSubmission = useCallback(async (
    submissionId: string,
    reviewerId: string,
  ): Promise<{ error: string | null }> => {
    const { error } = await supabase
      .from('submissions')
      .update({
        status: 'rejected',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (error) return { error: error.message };
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? { ...s, status: 'rejected', reviewed_by: reviewerId, reviewed_at: new Date().toISOString() }
          : s,
      ),
    );
    return { error: null };
  }, []);

  return {
    submissions,
    loading,
    fetchSubmissions,
    fetchMySubmissions,
    submitProof,
    approveSubmission,
    rejectSubmission,
    setSubmissions,
  };
}
