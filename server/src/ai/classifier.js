import { z } from 'zod';
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from '../domain/constants.js';
import { AiUnavailableError, complete } from './openai.client.js';
import { TRIAGE_RESPONSE_FORMAT, buildTriageMessages } from './prompts/triage.prompt.js';

// Structured outputs already constrain the shape; this guards against
// provider/SDK changes so a bad payload never reaches the database.
const triageSchema = z.object({
  reasoning: z.string(),
  category: z.enum(TICKET_CATEGORIES),
  priority: z.enum(TICKET_PRIORITIES),
  confidence: z.number(),
});

/**
 * input: { subject, description, book }
 * returns: { reasoning, category, priority, confidence, model }
 */
export async function classifyWithAi(input, ticketId) {
  const result = await complete({
    operation: 'triage',
    ticketId,
    messages: buildTriageMessages(input),
    maxTokens: 150,
    temperature: 0,
    responseFormat: TRIAGE_RESPONSE_FORMAT,
  });

  let payload;
  try {
    payload = JSON.parse(result.content);
  } catch {
    throw new AiUnavailableError('invalid_response', 'AI triage returned malformed JSON.');
  }

  const parsed = triageSchema.safeParse(payload);
  if (!parsed.success) {
    throw new AiUnavailableError('invalid_response', 'AI triage returned an unexpected shape.');
  }

  return {
    ...parsed.data,
    confidence: Math.min(Math.max(parsed.data.confidence, 0), 1),
    model: result.model,
  };
}
