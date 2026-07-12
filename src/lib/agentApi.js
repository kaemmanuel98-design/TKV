import { API_BASE, parseApiResponse } from './apiClient.js';

export async function getAgentUsage(accessToken) {
  const res = await fetch(`${API_BASE}/api/agent/usage`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  return parseApiResponse(res);
}

export async function postAgentChat({ message, language, history, accessToken, userType }) {
  const res = await fetch(`${API_BASE}/api/agent/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ message, language, history, userType }),
  });
  return parseApiResponse(res);
}

/** Chat Mim avec streaming SSE (réponse progressive). */
export async function streamAgentChat({
  message,
  language,
  history,
  accessToken,
  userType,
  onToken,
  onDone,
  signal,
}) {
  const res = await fetch(`${API_BASE}/api/agent/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ message, language, history, userType }),
    signal,
  });

  if (!res.ok) {
    return parseApiResponse(res);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('stream_unsupported');

  const decoder = new TextDecoder();
  let buffer = '';
  let result = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() || '';

    for (const block of blocks) {
      if (!block.trim()) continue;
      let event = 'message';
      let dataLine = '';
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        if (line.startsWith('data:')) dataLine += line.slice(5).trim();
      }
      if (!dataLine) continue;
      const parsed = JSON.parse(dataLine);
      if (event === 'token' && parsed.t) onToken?.(parsed.t);
      if (event === 'done') {
        result = parsed;
        onDone?.(parsed);
      }
      if (event === 'error') {
        const err = new Error(parsed.error || 'agent_error');
        err.status = 500;
        throw err;
      }
    }
  }

  return result;
}

export async function postAgentTranscribe({ audioBase64, language, accessToken }) {
  const res = await fetch(`${API_BASE}/api/agent/transcribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ audio: audioBase64, language }),
  });
  return parseApiResponse(res);
}

export async function postAgentPerspectives({ question, language, accessToken, userType }) {
  const res = await fetch(`${API_BASE}/api/agent/perspectives`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ question, language, userType }),
  });
  return parseApiResponse(res);
}

export async function getAgentHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  return parseApiResponse(res);
}
