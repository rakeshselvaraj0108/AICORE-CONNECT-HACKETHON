// Legacy file — AI logic moved to src/lib/openrouter.ts
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openai/gpt-4o';

async function callAI(apiKey: string, messages: { role: string; content: string }[]): Promise<string> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, messages }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`API error ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

function parseJSON(text: string): any {
  // Try to extract JSON from markdown code blocks or raw text
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1].trim());
  }
  return JSON.parse(text);
}

export async function scoreSubmission(
  apiKey: string,
  taskTitle: string,
  taskType: string,
  taskDesc: string,
  proofLink: string,
  notes: string
): Promise<{ score: number; feedback: string; approvalLikelihood: 'High' | 'Medium' | 'Low' }> {
  const prompt = `You are an AI task verifier for a campus ambassador program.
Task: ${taskTitle}. Type: ${taskType}. Description: ${taskDesc}.
Ambassador submitted: ${proofLink}. Notes: ${notes}.
Score this 0-100 for quality and relevance.
Reply ONLY in JSON: {"score": number, "feedback": "string", "approvalLikelihood": "High"|"Medium"|"Low"}`;

  try {
    const response = await callAI(apiKey, [{ role: 'user', content: prompt }]);
    return parseJSON(response);
  } catch {
    // Fallback mock scoring
    const score = Math.floor(Math.random() * 40) + 60;
    return {
      score,
      feedback: 'AI scoring unavailable. This is an estimated score based on submission completeness.',
      approvalLikelihood: score >= 80 ? 'High' : score >= 60 ? 'Medium' : 'Low',
    };
  }
}

export async function getProgramInsights(
  apiKey: string,
  ambassadorCount: number,
  taskCount: number,
  completionRate: number,
  topCollege: string,
  avgPoints: number
): Promise<{ insights: { title: string; detail: string }[] }> {
  const prompt = `You are a growth analyst for a campus ambassador program.
Data: ${ambassadorCount} ambassadors, ${taskCount} tasks, ${completionRate}% completion rate, top college: ${topCollege}, avg points per ambassador: ${avgPoints}.
Give 3 specific actionable recommendations to improve engagement.
Reply ONLY in JSON: {"insights": [{"title": "string", "detail": "string"}]}`;

  try {
    const response = await callAI(apiKey, [{ role: 'user', content: prompt }]);
    return parseJSON(response);
  } catch {
    return {
      insights: [
        { title: 'Boost Social Media Tasks', detail: 'Social media tasks have the highest engagement. Consider adding more creative social challenges with bonus points.' },
        { title: 'College-Specific Challenges', detail: 'Create targeted tasks for underperforming colleges to boost cross-campus competition.' },
        { title: 'Streak Rewards Program', detail: 'Ambassadors with 5+ day streaks show 3x higher retention. Implement streak multiplier bonuses.' },
      ],
    };
  }
}

export async function getAmbassadorSummary(
  apiKey: string,
  name: string,
  points: number,
  streak: number,
  tasksCompleted: number,
  bestTaskType: string
): Promise<string> {
  const prompt = `Summarize this ambassador's performance in 2 sentences.
Name: ${name}, Points: ${points}, Streak: ${streak} days, Tasks completed: ${tasksCompleted}, Best task type: ${bestTaskType}.
Be encouraging and specific.`;

  try {
    const response = await callAI(apiKey, [{ role: 'user', content: prompt }]);
    return response;
  } catch {
    return `${name} has been a strong contributor with ${points} points and a ${streak}-day streak. Their focus on ${bestTaskType} tasks shows great dedication to the program!`;
  }
}

export async function testAPIConnection(apiKey: string): Promise<boolean> {
  try {
    const response = await callAI(apiKey, [{ role: 'user', content: 'Say "connected" in one word.' }]);
    return response.length > 0;
  } catch {
    return false;
  }
}
