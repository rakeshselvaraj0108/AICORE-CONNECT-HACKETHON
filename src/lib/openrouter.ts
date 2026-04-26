import type { Task } from '../types';

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openai/gpt-oss-120b:free';

function getHeaders(apiKey: string): Record<string, string> {
  const finalKey = apiKey || import.meta.env.VITE_OPENROUTER_KEY || '';
  return {
    Authorization: `Bearer ${finalKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://campusconnect.app',
    'X-Title': 'CampusConnect',
  };
}

async function callAI(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: getHeaders(apiKey),
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter error ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

function parseJSON<T>(text: string): T {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\})/);
  return JSON.parse(match ? match[1].trim() : text.trim()) as T;
}

export interface ScoreResult {
  score: number;
  feedback: string;
  approvalLikelihood: 'High' | 'Medium' | 'Low';
}

export async function scoreSubmission(
  task: Pick<Task, 'title' | 'task_type' | 'description'>,
  proofDescription: string,
  notes: string,
  apiKey: string,
): Promise<ScoreResult> {
  try {
    const isFileUpload = proofDescription.startsWith('File uploaded:');
    const isTextResponse = proofDescription.startsWith('Text response provided:') || proofDescription.startsWith('[text-response]');
    const isLink = proofDescription.startsWith('Link submitted:');

    let proofContext = '';
    if (isFileUpload) {
      proofContext = `The ambassador uploaded a file as proof. ${proofDescription}. Evaluate whether the file type and name suggest relevant proof for this task type.`;
    } else if (isTextResponse) {
      proofContext = `The ambassador wrote a text response as proof: ${proofDescription}. Evaluate the quality, depth, and relevance of the written response.`;
    } else if (isLink) {
      proofContext = `The ambassador provided a link: ${proofDescription}. Evaluate whether the URL domain and format match the expected proof for this task type.`;
    } else {
      proofContext = `Proof submitted: ${proofDescription}`;
    }

    const taskTypeGuidelines: Record<string, string> = {
      'Social Media': 'Expected proof: A link to a social media post (Instagram, Twitter, LinkedIn, etc.) or a screenshot/screen recording of the post. Check if the URL matches a social media platform.',
      'Content Creation': 'Expected proof: An uploaded document (PDF, DOCX, blog post), video file, or a link to published content (Medium, YouTube, blog). Evaluate content quality indicators.',
      'Event Promotion': 'Expected proof: Photos or videos from the event, promotional material screenshots, or links to event pages. Look for visual evidence of promotion.',
      'Survey': 'Expected proof: An uploaded survey report (PDF, CSV, Excel), or a detailed text summary of survey findings with data points. Evaluate completeness of the response.',
      'Referral': 'Expected proof: Referral codes, signup confirmation screenshots, referral links, or text listing successful referrals. Verify proof format matches referral activity.',
    };

    const guidelines = taskTypeGuidelines[task.task_type] ?? 'Evaluate the proof for relevance and completeness.';

    const prompt = `You are an expert AI task verifier for a campus ambassador program. Your job is to evaluate proof of task completion.

TASK DETAILS:
- Title: ${task.title}
- Type: ${task.task_type}
- Description: ${task.description}

EVALUATION GUIDELINES FOR ${task.task_type.toUpperCase()}:
${guidelines}

SUBMITTED PROOF:
${proofContext}
${notes ? `Additional notes from ambassador: "${notes}"` : 'No additional notes provided.'}

SCORING CRITERIA:
- 90-100: Excellent proof that clearly demonstrates task completion with high quality
- 70-89: Good proof that reasonably demonstrates task completion
- 50-69: Acceptable proof but missing some elements or quality concerns
- 30-49: Weak proof that doesn't clearly demonstrate task completion
- 0-29: Invalid or irrelevant proof

Reply ONLY with valid JSON, no markdown wrapping: {"score": number, "feedback": "detailed feedback string explaining your evaluation", "approvalLikelihood": "High" or "Medium" or "Low"}`;

    const response = await callAI(apiKey, prompt);
    return parseJSON<ScoreResult>(response);
  } catch {
    return { score: 75, feedback: 'AI unavailable — manual review recommended.', approvalLikelihood: 'Medium' };
  }
}

export interface Insight {
  title: string;
  detail: string;
}

export async function getProgramInsights(
  stats: { ambassadorCount: number; taskCount: number; completionRate: number; topCollege: string; avgPoints: number },
  apiKey: string,
): Promise<Insight[]> {
  try {
    const prompt = `You are a growth analyst for a campus ambassador program.
Data: ${stats.ambassadorCount} ambassadors, ${stats.taskCount} tasks, ${stats.completionRate.toFixed(1)}% completion rate, top college: ${stats.topCollege}, avg points per ambassador: ${stats.avgPoints.toFixed(0)}.
Give 3 specific actionable recommendations to improve engagement.
Reply ONLY valid JSON no markdown: {"insights": [{"title": "string", "detail": "string"}]}`;
    const response = await callAI(apiKey, prompt);
    const parsed = parseJSON<{ insights: Insight[] }>(response);
    return parsed.insights;
  } catch {
    return [
      { title: 'Boost Social Media Tasks', detail: 'Social media tasks drive the highest engagement. Add creative visual challenges with bonus points for top-performing content.' },
      { title: 'College-Specific Competitions', detail: 'Launch inter-college leaderboards to trigger competitive spirit and boost submissions from lower-performing campuses.' },
      { title: 'Streak Multiplier Rewards', detail: 'Ambassadors with 5+ day streaks show 3× higher retention. Introduce streak multiplier bonuses to reward consistency.' },
    ];
  }
}

export async function getAmbassadorSummary(
  ambassador: { full_name: string; points: number; streak: number },
  stats: { tasksCompleted: number; bestTaskType: string },
  apiKey: string,
): Promise<string> {
  try {
    const prompt = `Summarize this campus ambassador's performance in exactly 2 sentences. Be encouraging and specific.
Name: ${ambassador.full_name}, Points: ${ambassador.points}, Streak: ${ambassador.streak} days, Tasks completed: ${stats.tasksCompleted}, Best task type: ${stats.bestTaskType}.`;
    return await callAI(apiKey, prompt);
  } catch {
    return `${ambassador.full_name} has been an outstanding contributor with ${ambassador.points} points and a ${ambassador.streak}-day streak. Their dedication to ${stats.bestTaskType} tasks sets a high bar for the program!`;
  }
}

export async function testAPIConnection(apiKey: string): Promise<boolean> {
  try {
    const response = await callAI(apiKey, 'Reply with exactly one word: connected');
    return response.trim().length > 0;
  } catch {
    return false;
  }
}
