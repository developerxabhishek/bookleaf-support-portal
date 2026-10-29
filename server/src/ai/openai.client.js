import OpenAI from 'openai';
import { Types } from 'mongoose';
import { env } from '../config/env.js';
import { AiCall } from '../models/ai-call.model.js';

/**
 * Thin wrapper around the OpenAI SDK that every AI feature goes through.
 * It owns the production concerns so callers don't have to:
 *  - the API key stays server-side (read from env, never sent to the client)
 *  - timeouts + retries with backoff (SDK built-ins, tuned here)
 *  - a circuit breaker so an outage fails fast instead of stacking 20s timeouts
 *  - one error type (AiUnavailableError) that callers degrade on
 *  - per-call token/latency logging for cost monitoring
 */

/**
 * reason is one of: disabled, circuit_open, rate_limited, timeout, auth,
 * invalid_response, upstream_error
 */
export class AiUnavailableError extends Error {
  constructor(reason, message) {
    super(message);
    this.name = 'AiUnavailableError';
    this.reason = reason;
  }
}

/** Opens after `threshold` consecutive failures; lets one probe through after `cooldownMs`. */
class CircuitBreaker {
  #consecutiveFailures = 0;
  #openedAt = 0;

  constructor(threshold, cooldownMs) {
    this.threshold = threshold;
    this.cooldownMs = cooldownMs;
  }

  get isOpen() {
    return this.#consecutiveFailures >= this.threshold && Date.now() - this.#openedAt < this.cooldownMs;
  }

  recordSuccess() {
    this.#consecutiveFailures = 0;
  }

  recordFailure() {
    this.#consecutiveFailures += 1;
    if (this.#consecutiveFailures >= this.threshold) this.#openedAt = Date.now();
  }
}

const breaker = new CircuitBreaker(3, 60_000);

const client = env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: env.OPENAI_API_KEY, timeout: env.AI_TIMEOUT_MS, maxRetries: 2 })
  : null;

export function getAiStatus() {
  return {
    enabled: client !== null,
    model: env.OPENAI_MODEL,
    available: client !== null && !breaker.isOpen,
  };
}

function toAiError(error) {
  if (error instanceof AiUnavailableError) return error;
  if (error instanceof OpenAI.RateLimitError) {
    return new AiUnavailableError('rate_limited', 'AI provider rate limit or quota reached.');
  }
  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    return new AiUnavailableError('timeout', 'AI provider timed out.');
  }
  if (error instanceof OpenAI.AuthenticationError || error instanceof OpenAI.PermissionDeniedError) {
    return new AiUnavailableError('auth', 'AI provider rejected the API key.');
  }
  const message = error instanceof Error ? error.message : String(error);
  return new AiUnavailableError('upstream_error', `AI provider error: ${message}`);
}

function recordUsage(request, fields) {
  // Fire-and-forget: usage logging must never break the request it describes.
  AiCall.create({
    operation: request.operation,
    ticket: request.ticketId ? new Types.ObjectId(request.ticketId) : undefined,
    model: fields.model ?? env.OPENAI_MODEL,
    ...fields,
  }).catch((error) => console.warn('[ai] failed to record usage', error));
}

/**
 * request: { operation: 'triage' | 'draft', ticketId?, messages, maxTokens, temperature, responseFormat? }
 * returns: { content, model, finishReason, promptTokens, completionTokens }
 */
export async function complete(request) {
  if (!client) {
    throw new AiUnavailableError('disabled', 'AI is not configured (OPENAI_API_KEY is not set).');
  }
  if (breaker.isOpen) {
    throw new AiUnavailableError('circuit_open', 'AI is temporarily paused after repeated failures.');
  }

  const startedAt = Date.now();
  try {
    const response = await client.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: request.messages,
      max_completion_tokens: request.maxTokens,
      temperature: request.temperature,
      ...(request.responseFormat ? { response_format: request.responseFormat } : {}),
    });

    const choice = response.choices[0];
    const content = choice?.message.content?.trim();
    if (!choice || !content) {
      throw new AiUnavailableError('invalid_response', 'AI returned an empty response.');
    }

    breaker.recordSuccess();
    const usage = {
      promptTokens: response.usage?.prompt_tokens ?? 0,
      cachedPromptTokens: response.usage?.prompt_tokens_details?.cached_tokens ?? 0,
      completionTokens: response.usage?.completion_tokens ?? 0,
    };
    recordUsage(request, { outcome: 'success', latencyMs: Date.now() - startedAt, model: response.model, ...usage });

    return {
      content,
      model: response.model,
      finishReason: choice.finish_reason,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
    };
  } catch (error) {
    const failure = toAiError(error);
    // A malformed answer is not an outage; only provider failures trip the breaker.
    if (failure.reason !== 'invalid_response') breaker.recordFailure();
    recordUsage(request, { outcome: 'error', latencyMs: Date.now() - startedAt, errorReason: failure.reason });
    console.warn(`[ai] ${request.operation} failed (${failure.reason}): ${failure.message}`);
    throw failure;
  }
}
