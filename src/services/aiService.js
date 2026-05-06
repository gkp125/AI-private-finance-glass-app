import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Call Anthropic Claude via direct browser fetch.
 * Requires the user to supply their own API key — never hardcoded.
 */
export async function callClaude(prompt, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err?.error?.message || `HTTP ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

/**
 * Call Google Gemini 1.5 Flash (free tier, browser-safe).
 * Key is free at https://aistudio.google.com/app/apikey — no card needed.
 */
export async function callGemini(prompt, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Route to the correct provider based on settings.aiProvider.
 * settings = { aiProvider: 'claude'|'gemini', claudeKey, geminiKey }
 */
export async function callAI(prompt, settings) {
  const provider = settings?.aiProvider || 'claude';

  if (provider === 'gemini') {
    const key = settings?.geminiKey || '';
    if (!key) throw new Error('No Gemini API key configured. Add one in Settings → AI.');
    return callGemini(prompt, key);
  }

  // default: claude
  const key = settings?.claudeKey || '';
  if (!key) throw new Error('No Claude API key configured. Add one in Settings → AI.');
  return callClaude(prompt, key);
}
