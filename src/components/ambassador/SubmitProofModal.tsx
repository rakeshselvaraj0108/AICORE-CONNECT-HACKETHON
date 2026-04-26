import { useState, useRef } from 'react';
import { Loader2, Upload, Link as LinkIcon, FileText, Image, Film, X, CheckCircle2 } from 'lucide-react';
import Modal from '../ui/Modal';
import AIScoreReveal from '../ui/AIScoreReveal';
import { scoreSubmission } from '../../lib/openrouter';
import { uploadProofFile, getProofConfig, getFileCategory, type ProofMethod } from '../../lib/storage';
import type { Task, ApprovalLikelihood } from '../../types';

interface SubmitProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  openrouterKey: string | null;
  ambassadorId: string;
  onSubmit: (
    proofUrl: string,
    notes: string,
    aiScore: number | null,
    aiFeedback: string | null,
    aiLikelihood: ApprovalLikelihood | null
  ) => Promise<{ error: string | null }>;
}

const METHOD_META: Record<ProofMethod, { icon: typeof LinkIcon; label: string }> = {
  link: { icon: LinkIcon, label: 'Paste Link' },
  file: { icon: Upload, label: 'Upload File' },
  text: { icon: FileText, label: 'Write Text' },
};

const FILE_ICONS: Record<string, typeof Image> = {
  image: Image,
  video: Film,
  document: FileText,
};

export default function SubmitProofModal({ isOpen, onClose, task, openrouterKey, ambassadorId, onSubmit }: SubmitProofModalProps) {
  const [step, setStep] = useState<'form' | 'score'>('form');
  const [method, setMethod] = useState<ProofMethod | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [textProof, setTextProof] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [proofError, setProofError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [aiLikelihood, setAiLikelihood] = useState<ApprovalLikelihood | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const config = task ? getProofConfig(task.task_type) : null;

  // Auto-select the first method when task changes
  if (config && method === null) {
    setMethod(config.methods[0]);
  }

  const handleClose = () => {
    setStep('form');
    setMethod(null);
    setProofUrl('');
    setTextProof('');
    setSelectedFile(null);
    setFilePreview(null);
    setNotes('');
    setProofError('');
    setAiScore(null);
    setAiFeedback(null);
    setAiLikelihood(null);
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setProofError('File size must be under 50 MB');
      return;
    }
    setSelectedFile(file);
    setProofError('');
    // Preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };


  const handleAIScore = async () => {
    if (!task || !config) return;

    // Validate proof based on method
    if (method === 'link' && !proofUrl.trim()) {
      setProofError('Please provide a link');
      return;
    }
    if (method === 'file' && !selectedFile) {
      setProofError('Please upload a file');
      return;
    }
    if (method === 'text' && !textProof.trim()) {
      setProofError('Please enter your response');
      return;
    }

    let finalProofUrl = '';

    // If file upload, handle upload first
    if (method === 'file' && selectedFile) {
      setUploadProgress(true);
      const { url, error } = await uploadProofFile(selectedFile, ambassadorId);
      setUploadProgress(false);
      if (error || !url) {
        setProofError(error || 'Upload failed. Please try again.');
        return;
      }
      finalProofUrl = url;
      setProofUrl(url); // Store for final submission
    } else if (method === 'link') {
      finalProofUrl = proofUrl.trim();
    } else if (method === 'text') {
      finalProofUrl = `[text-response] ${textProof.trim()}`;
      setProofUrl(finalProofUrl);
    }

    setStep('score');
    setAiLoading(true);

    // Build context-aware proof description for AI
    const proofDescription = method === 'file' && selectedFile
      ? `File uploaded: ${selectedFile.name} (${getFileCategory(selectedFile)}, ${(selectedFile.size / 1024).toFixed(0)} KB). URL: ${finalProofUrl}`
      : method === 'text'
        ? `Text response provided: "${textProof.trim().substring(0, 500)}"`
        : `Link submitted: ${finalProofUrl}`;

    const result = await scoreSubmission(task, proofDescription, notes.trim(), openrouterKey ?? '');
    setAiScore(result.score);
    setAiFeedback(result.feedback);
    setAiLikelihood(result.approvalLikelihood);
    setAiLoading(false);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    const finalUrl = method === 'text' ? `[text-response] ${textProof.trim()}` : proofUrl.trim();
    const { error } = await onSubmit(finalUrl, notes.trim(), aiScore, aiFeedback, aiLikelihood);
    setSubmitting(false);
    if (!error) {
      handleClose();
    }
  };

  if (!task || !config) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={step === 'form' ? 'Submit Proof' : 'AI Score'}>
      <div className="space-y-4">
        {step === 'form' ? (
          <>
            {/* Task info card */}
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200">
                  {task.task_type}
                </span>
              </div>
              <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">{task.title}</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-1">{task.description}</p>
              <p className="text-xs text-indigo-500 mt-2 font-medium">Worth {task.points} points</p>
            </div>

            {/* Proof method selector */}
            {config.methods.length > 1 && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  How will you submit proof?
                </label>
                <div className="flex gap-2">
                  {config.methods.map((m) => {
                    const { icon: Icon, label } = METHOD_META[m];
                    const isActive = method === m;
                    return (
                      <button
                        key={m}
                        onClick={() => { setMethod(m); setProofError(''); clearFile(); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 border ${
                          isActive
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                            : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-indigo-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hint */}
            <p className="text-xs text-gray-400 dark:text-gray-500 italic leading-relaxed">{config.hint}</p>

            {/* Dynamic proof input */}
            {method === 'link' && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  {config.label} <span className="text-red-500">*</span>
                </label>
                <input
                  value={proofUrl}
                  onChange={(e) => { setProofUrl(e.target.value); setProofError(''); }}
                  placeholder={config.placeholder}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {method === 'file' && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Upload File <span className="text-red-500">*</span>
                </label>

                {!selectedFile ? (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors group"
                  >
                    <Upload className="w-8 h-8 text-gray-300 dark:text-gray-600 group-hover:text-indigo-500 transition-colors" />
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Click to browse files</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">Max 50 MB · Images, videos, PDFs, docs</span>
                  </button>
                ) : (
                  <div className="relative rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
                    <button onClick={clearFile} className="absolute top-2 right-2 p-1 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                      <X className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                    </button>
                    <div className="flex items-center gap-3">
                      {/* Preview */}
                      {filePreview && selectedFile?.type.startsWith('image/') && (
                        <img src={filePreview} alt="Preview" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                      )}
                      {filePreview && selectedFile?.type.startsWith('video/') && (
                        <video src={filePreview} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" muted />
                      )}
                      {!filePreview && (
                        <div className="w-16 h-16 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                          {(() => { const Icon = FILE_ICONS[getFileCategory(selectedFile)] ?? FileText; return <Icon className="w-6 h-6 text-indigo-600" />; })()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{selectedFile.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {(selectedFile.size / 1024).toFixed(0)} KB · {getFileCategory(selectedFile)}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-green-600 dark:text-green-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span className="text-[10px] font-semibold">Ready to upload</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <input
                  ref={fileRef}
                  type="file"
                  accept={config.acceptedFiles}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}

            {method === 'text' && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Your Response <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={textProof}
                  onChange={(e) => { setTextProof(e.target.value); setProofError(''); }}
                  rows={5}
                  placeholder={config.placeholder}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <p className="text-[10px] text-gray-400 text-right mt-1">{textProof.length} chars</p>
              </div>
            )}

            {proofError && <p className="text-xs text-red-500 font-medium">{proofError}</p>}

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Additional context…"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Submit button */}
            <button
              onClick={handleAIScore}
              disabled={uploadProgress}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {uploadProgress ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
              ) : (
                'Submit + AI Score →'
              )}
            </button>
          </>
        ) : (
          <>
            <AIScoreReveal isLoading={aiLoading} score={aiScore} feedback={aiFeedback} approvalLikelihood={aiLikelihood} />
            {!aiLoading && aiScore !== null && (
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Confirm Submission'}
              </button>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
