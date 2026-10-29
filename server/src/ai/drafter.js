import { selectKnowledge } from './knowledge-base.js';
import { complete } from './openai.client.js';
import { buildDraftMessages } from './prompts/draft.prompt.js';

/**
 * returns: { body, model, kbSections, promptTokens, completionTokens }
 */
export async function draftReply(input, ticketId) {
  // Retrieve on the latest author message too, so follow-ups on new topics pull the right policy.
  const latestAuthorText = input.conversation.findLast((turn) => turn.from === 'author')?.body ?? '';
  const sections = selectKnowledge(input.category, `${input.subject}\n${input.description}\n${latestAuthorText}`);

  const result = await complete({
    operation: 'draft',
    ticketId,
    messages: buildDraftMessages(input, sections),
    maxTokens: 600,
    temperature: 0.4,
  });

  return {
    body: result.content,
    model: result.model,
    kbSections: sections.map((section) => section.title),
    promptTokens: result.promptTokens,
    completionTokens: result.completionTokens,
  };
}
