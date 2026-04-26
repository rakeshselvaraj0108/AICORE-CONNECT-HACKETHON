import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Task, TaskType } from '../types';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async (orgId: string, ambassadorId?: string) => {
    setLoading(true);
    let query = supabase
      .from('tasks')
      .select('*, task_assignments(ambassador_id)')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    const { data, error } = await query;
    let filteredData = data as any[];

    if (!error && data && ambassadorId) {
      filteredData = data.filter((t: any) => 
        t.assignment_type === 'global' || 
        t.task_assignments?.some((a: any) => a.ambassador_id === ambassadorId)
      );
    }

    if (!error && filteredData) setTasks(filteredData as Task[]);
    setLoading(false);
    return (filteredData as Task[]) ?? [];
  }, []);

  const createTask = useCallback(async (
    orgId: string,
    createdBy: string,
    task: { title: string; description: string; task_type: TaskType; points: number; deadline: string; assignment_type: 'global' | 'specific' },
    assignedAmbassadorIds: string[] = []
  ): Promise<{ error: string | null }> => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...task, org_id: orgId, created_by: createdBy })
      .select()
      .single();
      
    if (error) return { error: error.message };

    if (task.assignment_type === 'specific' && assignedAmbassadorIds.length > 0) {
      const assignments = assignedAmbassadorIds.map(id => ({
        task_id: data.id,
        ambassador_id: id,
        assigned_by: createdBy
      }));
      await supabase.from('task_assignments').insert(assignments);
    }

    await supabase.from('activity').insert({
      org_id: orgId,
      actor_id: createdBy,
      text: `New task created: "${task.title}"`,
      type: 'task_created',
    });

    if (data) setTasks((prev) => [data as Task, ...prev]);
    return { error: null };
  }, []);

  const deleteTask = useCallback(async (taskId: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.from('tasks').update({ is_active: false }).eq('id', taskId);
    if (error) return { error: error.message };
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    return { error: null };
  }, []);

  const updateTask = useCallback(async (
    taskId: string,
    updates: Partial<Pick<Task, 'title' | 'description' | 'task_type' | 'points' | 'deadline'>>,
  ): Promise<{ error: string | null }> => {
    const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);
    if (error) return { error: error.message };
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
    return { error: null };
  }, []);

  return { tasks, loading, fetchTasks, createTask, deleteTask, updateTask, setTasks };
}
