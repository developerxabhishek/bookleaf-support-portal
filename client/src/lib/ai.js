import { errorCode } from '../api/client.js';

/** Human-readable versions of the server's AiUnavailableError reasons. */
export const AI_FAILURE_LABELS = {
  disabled: 'AI is not configured on the server',
  circuit_open: 'AI is paused after repeated provider errors',
  rate_limited: 'the AI provider is rate-limiting us',
  timeout: 'the AI provider timed out',
  auth: 'the AI provider rejected our API key',
  invalid_response: 'the AI returned an unexpected response',
  upstream_error: 'the AI provider returned an error',
};

export function describeAiFailure(reason) {
  return AI_FAILURE_LABELS[reason] ?? 'the AI service is unavailable';
}

export function aiFailureReason(error) {
  if (errorCode(error) !== 'AI_UNAVAILABLE') return null;
  return error.response.data.error.details?.reason ?? 'upstream_error';
}
