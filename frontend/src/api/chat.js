const BASE = '/api/chat';

/**
 * Streams an AI response via SSE.
 * Calls onDelta(delta) for each token, onDone({ conversationId, title }) at end.
 */
export async function streamMessage({ conversationId, message, tone, onDelta, onDone, onError }) {
  const res = await fetch(`${BASE}/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, message, tone }),
  });

  if (!res.ok) {
    const err = await res.json();
    onError?.(err.error || 'Stream failed');
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep incomplete line

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const json = JSON.parse(line.slice(6));
        if (json.error) {
          onError?.(json.error);
          return;
        }
        if (json.delta) {
          fullContent += json.delta;
          onDelta?.(json.delta);
        }
        if (json.done) {
          onDone?.({ conversationId: json.conversationId, title: json.title, fullContent });
        }
      } catch {
        // malformed SSE line — skip
      }
    }
  }
}

/**
 * Regenerates the last AI response for a conversation.
 */
export async function regenerateMessage({ conversationId, tone, onDelta, onDone, onError }) {
  const res = await fetch(`${BASE}/regenerate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, tone }),
  });

  if (!res.ok) {
    const err = await res.json();
    onError?.(err.error || 'Regenerate failed');
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const json = JSON.parse(line.slice(6));
        if (json.error) { onError?.(json.error); return; }
        if (json.delta) {
          fullContent += json.delta;
          onDelta?.(json.delta);
        }
        if (json.done) {
          onDone?.({ conversationId: json.conversationId, fullContent });
        }
      } catch { /* skip */ }
    }
  }
}
