export type UserRole = 'admin' | 'ambassador';
export type TaskType = 'Referral' | 'Content Creation' | 'Social Media' | 'Event Promotion' | 'Survey';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';
export type ApprovalLikelihood = 'High' | 'Medium' | 'Low';
export type RankTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
export type ActivityType = 'submission' | 'approval' | 'rejection' | 'task_created' | 'badge_earned' | 'points';

export interface Organization {
  id: string;
  name: string;
  email: string;
  logo_url: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  college: string | null;
  role: UserRole;
  org_id: string | null;
  points: number;
  streak: number;
  last_active_date: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  org_id: string;
  created_by: string | null;
  title: string;
  description: string;
  task_type: TaskType;
  points: number;
  deadline: string;
  is_active: boolean;
  assignment_type: 'global' | 'specific';
  created_at: string;
}

export interface Submission {
  id: string;
  task_id: string;
  ambassador_id: string;
  proof_url: string;
  notes: string | null;
  status: SubmissionStatus;
  ai_score: number | null;
  ai_feedback: string | null;
  ai_approval_likelihood: ApprovalLikelihood | null;
  points_awarded: number;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitted_at: string;
  profiles?: Profile;
  tasks?: Task;
}

export interface Badge {
  id: string;
  ambassador_id: string;
  badge_id: string;
  badge_name: string;
  earned_at: string;
}

export interface ActivityItem {
  id: string;
  org_id: string | null;
  actor_id: string | null;
  text: string;
  type: ActivityType | null;
  created_at: string;
}

export interface BadgeDefinition {
  id: string;
  emoji: string;
  name: string;
  description: string;
  progressHint: string;
}

export const ALL_BADGES: BadgeDefinition[] = [
  { id: 'first', emoji: '🎯', name: 'First Steps', description: 'Complete your first task', progressHint: 'Complete 1 task' },
  { id: 'referral_pro', emoji: '🤝', name: 'Referral Pro', description: 'Complete 5 referral tasks', progressHint: 'Complete 5 referrals' },
  { id: 'on_fire', emoji: '🔥', name: 'On Fire', description: 'Maintain a 3-day streak', progressHint: 'Keep a 3-day streak' },
  { id: 'overachiever', emoji: '⭐', name: 'Overachiever', description: 'Complete 10 tasks total', progressHint: 'Complete 10 tasks' },
  { id: 'club_500', emoji: '💎', name: 'Club 500', description: 'Earn 500 points', progressHint: 'Earn 500 points' },
  { id: 'elite', emoji: '👑', name: 'Elite', description: 'Earn 1500 points', progressHint: 'Earn 1500 points' },
  { id: 'social_star', emoji: '📱', name: 'Social Star', description: 'Complete 3 social media tasks', progressHint: 'Complete 3 social tasks' },
  { id: 'content_king', emoji: '✍️', name: 'Content King', description: 'Complete 5 content creation tasks', progressHint: 'Complete 5 content tasks' },
  { id: 'top_3', emoji: '🏆', name: 'Top 3', description: 'Reach the top 3 on the leaderboard', progressHint: 'Reach rank #1, #2, or #3' },
  { id: 'perfect_score', emoji: '💯', name: 'Perfect Score', description: 'Get an AI score of 95 or higher', progressHint: 'Get AI score ≥ 95' },
];

export function getTier(points: number): RankTier {
  if (points >= 1500) return 'Platinum';
  if (points >= 700) return 'Gold';
  if (points >= 300) return 'Silver';
  return 'Bronze';
}

export function getNextTier(points: number): { tier: RankTier; pointsNeeded: number } | null {
  if (points < 300) return { tier: 'Silver', pointsNeeded: 300 - points };
  if (points < 700) return { tier: 'Gold', pointsNeeded: 700 - points };
  if (points < 1500) return { tier: 'Platinum', pointsNeeded: 1500 - points };
  return null;
}

export function getTierProgress(points: number): number {
  if (points >= 1500) return 100;
  if (points >= 700) return ((points - 700) / (1500 - 700)) * 100;
  if (points >= 300) return ((points - 300) / (700 - 300)) * 100;
  return (points / 300) * 100;
}

export function getTierColor(tier: RankTier): string {
  switch (tier) {
    case 'Platinum': return 'text-cyan-400';
    case 'Gold': return 'text-amber-400';
    case 'Silver': return 'text-gray-400';
    default: return 'text-orange-600';
  }
}

export function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const past = new Date(dateStr).getTime();
  const diff = Math.floor((now - past) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
