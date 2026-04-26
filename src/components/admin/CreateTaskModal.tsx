import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import { useAmbassadors } from '../../hooks/useAmbassadors';
import type { TaskType } from '../../types';

const TASK_TYPES: TaskType[] = ['Referral', 'Content Creation', 'Social Media', 'Event Promotion', 'Survey'];

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  onCreate: (
    taskData: { title: string; description: string; task_type: TaskType; points: number; deadline: string; assignment_type: 'global' | 'specific' },
    assignedAmbassadors: string[]
  ) => Promise<{ error: string | null }>;
}

export default function CreateTaskModal({ isOpen, onClose, orgId, onCreate }: CreateTaskModalProps) {
  const { ambassadors, fetchAmbassadors } = useAmbassadors();
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    task_type: 'Social Media' as TaskType,
    points: 100,
    deadline: '',
    assignment_type: 'global' as 'global' | 'specific',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [selectedAmbassadors, setSelectedAmbassadors] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchAmbassadors(orgId);
    } else {
      // Reset state on close
      setForm({ title: '', description: '', task_type: 'Social Media', points: 100, deadline: '', assignment_type: 'global' });
      setSelectedAmbassadors([]);
      setFormErrors({});
      setSaving(false);
    }
  }, [isOpen, orgId, fetchAmbassadors]);

  const validateForm = () => {
    const e: Partial<Record<keyof typeof form, string>> = {};
    if (!form.title.trim()) { e.title = 'Title required'; }
    if (!form.description.trim()) { e.description = 'Description required'; }
    if (!form.deadline) { e.deadline = 'Deadline required'; }
    if (form.points < 1) { e.points = 'Points must be > 0'; }
    if (form.assignment_type === 'specific' && selectedAmbassadors.length === 0) {
      e.assignment_type = 'specific';
    }
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    setSaving(true);
    const { error } = await onCreate(form, selectedAmbassadors);
    setSaving(false);
    if (!error) {
      onClose();
    }
  };

  const toggleAmbassador = (id: string) => {
    setSelectedAmbassadors(prev =>
      prev.includes(id) ? prev.filter(aId => aId !== id) : [...prev, id]
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Task">
      <div className="space-y-4 max-h-[80vh] overflow-y-auto p-1">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Task Title</label>
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Share an Instagram story…"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          {formErrors.title && <p className="text-xs text-red-500 mt-1">{formErrors.title}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Detailed instructions…" rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          {formErrors.description && <p className="text-xs text-red-500 mt-1">{formErrors.description}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Type</label>
            <select value={form.task_type} onChange={(e) => setForm((f) => ({ ...f, task_type: e.target.value as TaskType }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {TASK_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Points</label>
            <input type="number" min={1} value={form.points} onChange={(e) => setForm((f) => ({ ...f, points: parseInt(e.target.value) || 0 }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            {formErrors.points && <p className="text-xs text-red-500 mt-1">{formErrors.points as string}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Deadline</label>
          <input type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          {formErrors.deadline && <p className="text-xs text-red-500 mt-1">{formErrors.deadline}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Assignment</label>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, assignment_type: 'global' }))}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${form.assignment_type === 'global' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 ring-2 ring-indigo-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
            >
              Global (All)
            </button>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, assignment_type: 'specific' }))}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${form.assignment_type === 'specific' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 ring-2 ring-indigo-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
            >
              Specific
            </button>
          </div>

          {form.assignment_type === 'specific' && (
            <div className="mt-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 mb-2">Select Ambassadors ({selectedAmbassadors.length} selected)</p>
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                {ambassadors.map(amb => (
                  <label key={amb.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedAmbassadors.includes(amb.id)}
                      onChange={() => toggleAmbassador(amb.id)}
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{amb.full_name}</span>
                      <span className="text-xs text-gray-500 truncate">{amb.college || 'No college'}</span>
                    </div>
                  </label>
                ))}
                {ambassadors.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-2">No ambassadors found.</p>
                )}
              </div>
              {formErrors.assignment_type && <p className="text-xs text-red-500 mt-2">{formErrors.assignment_type}</p>}
            </div>
          )}
        </div>

        <button onClick={handleCreate} disabled={saving} className="w-full mt-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create Task'}
        </button>
      </div>
    </Modal>
  );
}
