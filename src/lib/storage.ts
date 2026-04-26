import { supabase } from './supabase';

const BUCKET = 'proofs';
let bucketChecked = false;

async function ensureBucket() {
  if (bucketChecked) return;
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (!data) {
    await supabase.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 52428800 });
  }
  bucketChecked = true;
}

/** Convert a File to a base64 data URL */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve(`[file-upload] ${file.name} (${(file.size / 1024).toFixed(0)} KB, ${file.type})`);
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a file to Supabase Storage under the 'proofs' bucket.
 * Falls back to a file-description string if storage is unavailable.
 */
export async function uploadProofFile(
  file: File,
  ambassadorId: string,
): Promise<{ url: string | null; error: string | null }> {
  try {
    await ensureBucket();
  } catch {
    // Bucket creation may fail due to permissions — that's OK, we'll try uploading anyway
  }

  const ext = file.name.split('.').pop() ?? 'bin';
  const ts = Date.now();
  const path = `${ambassadorId}/${ts}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    // Fallback: convert file to base64 data URL so it can still be viewed
    const dataUrl = await fileToDataUrl(file);
    return { url: dataUrl, error: null };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

/**
 * Detect the proof category from a file's MIME type.
 */
export function getFileCategory(file: File): 'image' | 'video' | 'document' | 'unknown' {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (
    file.type === 'application/pdf' ||
    file.type.includes('word') ||
    file.type.includes('document') ||
    file.type.includes('spreadsheet') ||
    file.type.includes('presentation') ||
    file.type === 'text/plain' ||
    file.type === 'text/csv'
  ) return 'document';
  return 'unknown';
}

/** Accepted MIME types per task type */
export const ACCEPTED_FILES: Record<string, string> = {
  'Social Media': 'image/*,video/*',
  'Content Creation': 'image/*,video/*,application/pdf,.doc,.docx,.pptx,.txt',
  'Event Promotion': 'image/*,video/*',
  Survey: 'application/pdf,.csv,.xlsx,.doc,.docx,image/*',
  Referral: 'image/*,application/pdf',
};

/** Proof method options per task type */
export type ProofMethod = 'link' | 'file' | 'text';

export interface ProofConfig {
  methods: ProofMethod[];
  placeholder: string;
  label: string;
  hint: string;
  acceptedFiles: string;
}

export function getProofConfig(taskType: string): ProofConfig {
  switch (taskType) {
    case 'Social Media':
      return {
        methods: ['link', 'file'],
        placeholder: 'https://instagram.com/p/... or https://twitter.com/...',
        label: 'Post Link or Screenshot',
        hint: 'Paste a link to your social media post or upload a screenshot/screen recording.',
        acceptedFiles: ACCEPTED_FILES['Social Media'],
      };
    case 'Content Creation':
      return {
        methods: ['file', 'link'],
        placeholder: 'https://medium.com/... or https://youtube.com/...',
        label: 'Content File or Link',
        hint: 'Upload your document, video, or image — or paste a link to published content.',
        acceptedFiles: ACCEPTED_FILES['Content Creation'],
      };
    case 'Event Promotion':
      return {
        methods: ['file', 'link'],
        placeholder: 'https://eventbrite.com/... or social media post link',
        label: 'Event Photos/Videos or Link',
        hint: 'Upload photos or videos from the event, or share a link to the promotion post.',
        acceptedFiles: ACCEPTED_FILES['Event Promotion'],
      };
    case 'Survey':
      return {
        methods: ['file', 'text'],
        placeholder: 'Paste survey responses or summary here…',
        label: 'Survey Report or Responses',
        hint: 'Upload the survey report (PDF/CSV/Excel) or paste a summary of your findings.',
        acceptedFiles: ACCEPTED_FILES.Survey,
      };
    case 'Referral':
      return {
        methods: ['link', 'file', 'text'],
        placeholder: 'Referral code or signup confirmation link…',
        label: 'Referral Proof',
        hint: 'Provide a referral link, upload a screenshot, or paste referral codes.',
        acceptedFiles: ACCEPTED_FILES.Referral,
      };
    default:
      return {
        methods: ['link', 'file', 'text'],
        placeholder: 'Paste a link or upload a file…',
        label: 'Proof',
        hint: 'Provide any evidence of completion.',
        acceptedFiles: 'image/*,video/*,application/pdf,.doc,.docx',
      };
  }
}
