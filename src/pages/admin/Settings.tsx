import { useState } from 'react';
import { Save, Loader2, Trash2, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';
import { useAuth } from '../../hooks/useAuth';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function Settings() {
  const { org, profile } = useAppStore();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [orgName, setOrgName] = useState(org?.name ?? '');
  const [orgSaving, setOrgSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const saveOrg = async () => {
    if (!org || !orgName.trim()) return;
    setOrgSaving(true);
    const { error } = await supabase.from('organizations').update({ name: orgName.trim() }).eq('id', org.id);
    setOrgSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Organisation name saved');
  };

  const handleDelete = async () => {
    if (!profile) return;
    await supabase.auth.admin.deleteUser(profile.id).catch(() => {});
    await signOut();
    navigate('/login');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>

      {/* Organisation */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Organisation</h2>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Name</label>
          <input value={orgName} onChange={(e) => setOrgName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
          <input value={org?.email ?? ''} readOnly
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-500 cursor-not-allowed" />
        </div>
        <button onClick={saveOrg} disabled={orgSaving} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-60">
          {orgSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      {/* Danger zone */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-red-200 dark:border-red-900 shadow-sm p-6 space-y-3">
        <h2 className="text-base font-semibold text-red-600">Danger Zone</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => signOut().then(() => navigate('/login'))}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
          <button onClick={() => setShowDelete(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm font-medium text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
            <Trash2 className="w-4 h-4" /> Delete Account
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDelete}
        title="Delete Account"
        description="This permanently removes your account and all associated data. This cannot be undone."
        confirmLabel="Delete Account"
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
