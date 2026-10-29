import { isPayoutLikelyOverdue } from '../domain/royalty.js';

/**
 * Deterministic keyword triage. It runs instantly when a ticket is created
 * (so every ticket has a category and priority from the first second) and
 * is the result we keep whenever the LLM is unavailable.
 */

// [pattern, weight]: highly specific terms (ISBN, royalty, typesetting) outweigh incidental ones (Amazon, pages).
const CATEGORY_SIGNALS = [
  ['Royalty & Payments', [[/\broyalt/i, 3], [/\bpay(ment|out)s?\b/i, 2], [/\bpaid\b/i, 1], [/\bbank\b/i, 2], [/\bearnings?\b/i, 1], [/₹|\brs\.?\s?\d/i, 1]]],
  ['ISBN & Metadata Issues', [[/\bisbn/i, 4], [/\bmetadata\b/i, 3], [/\bauthor name\b/i, 2], [/\bwrong (title|author|cover|price)/i, 2], [/\bimprint\b/i, 2]]],
  ['Printing & Quality', [[/\bblurr?y\b/i, 3], [/\bbinding\b/i, 3], [/\bmisprint/i, 3], [/\bmisalign/i, 3], [/\bdefect/i, 3], [/\bprint(ed|ing)? quality\b/i, 3], [/\bprint(ed|ing)?\b/i, 1], [/\bpages?\b/i, 1], [/\bauthor cop(y|ies)\b/i, 1]]],
  ['Distribution & Availability', [[/\bunavailable\b/i, 3], [/\bout of stock\b/i, 3], [/\bnot available\b/i, 3], [/\bamazon\b/i, 1], [/\bflipkart\b/i, 1], [/\blist(ed|ing)\b/i, 1]]],
  ['Book Status & Production Updates', [[/\btypesett/i, 3], [/\bcover design\b/i, 3], [/\bproofread/i, 3], [/\bproduction\b/i, 2], [/\bmanuscript\b/i, 2], [/\bstill in\b/i, 1], [/\bwhen will\b/i, 1]]],
  // Per the knowledge base, change requests like "update my description/bio" are general inquiries.
  ['General Inquiry', [[/\b(update|change|edit|rewrite)\b.*\b(description|bio|blurb|photo|profile)\b/i, 2], [/\bpackages?\b/i, 2]]],
];

const LONG_WAIT = /\b((six|seven|eight|nine|ten|eleven|twelve|[6-9]|1\d|[2-9]\d)\s*\+?\s*months?|(a|one|over a|more than a)\s+year|\d+\s+years?)\b/i;
const NOT_RECEIVED = /\b(not|never|no|haven'?t|hasn'?t|didn'?t|without)\b/i;
const MONEY = /\b(royalt|payment|payout|paid)/i;
const LEGAL_OR_FRAUD = /\b(legal|lawyer|advocate|court|lawsuit|sue|consumer forum|fraud|scam|cheat(ed|ing)?|hacked|unauthori[sz]ed)\b/i;

const HIGH_SIGNALS = [
  /\bisbn\b.*\b(wrong|different|incorrect|duplicate|mismatch|error)\b|\b(wrong|different|incorrect|duplicate|mismatch)\b.*\bisbn\b/i,
  /\b(blurr?y|misprint|misaligned|binding|defect(ive)?|torn|smudged|missing pages)\b/i,
  /\b(currently unavailable|unavailable|out of stock|not available|not showing|removed)\b/i,
  /\b(haven'?t|have not|not|never) (received|been paid|got)\b|\boverdue\b/i,
  /\b(urgent|asap|immediately)\b/i,
];

const LOW_SIGNALS = [/\b(how (do|can) i|can i|is it possible|wondering|curious)\b/i, /\b(update|change|edit) (my|the) (author )?(bio|photo|profile|description)\b/i];

function pickCategory(text, input) {
  let best = { category: 'General Inquiry', score: 0 };
  for (const [category, signals] of CATEGORY_SIGNALS) {
    const score = signals.reduce((sum, [pattern, weight]) => sum + (pattern.test(text) ? weight : 0), 0);
    if (score > best.score) best = { category, score };
  }
  // A status question about a book that's still in production is a production update.
  if (best.score === 0 && input.book?.status.startsWith('In Production')) {
    return { category: 'Book Status & Production Updates', score: 1 };
  }
  return best;
}

function pickPriority(text, category, input) {
  if (LEGAL_OR_FRAUD.test(text)) return 'Critical';
  if (MONEY.test(text) && NOT_RECEIVED.test(text) && LONG_WAIT.test(text)) return 'Critical';
  if (HIGH_SIGNALS.some((pattern) => pattern.test(text))) return 'High';
  if (category === 'Royalty & Payments' && input.book && isPayoutLikelyOverdue(input.book, input.book.royaltyPending)) {
    return 'High';
  }
  if (category === 'ISBN & Metadata Issues' && /\bisbn\b/i.test(text)) return 'High';
  if ((category === 'General Inquiry' || category === 'ISBN & Metadata Issues') && LOW_SIGNALS.some((p) => p.test(text))) {
    return 'Low';
  }
  return category === 'General Inquiry' ? 'Low' : 'Medium';
}

/**
 * input: { subject, description, book } where book is the ticket's book (or null).
 * returns: { category, priority, confidence, reasoning }
 */
export function classifyWithRules(input) {
  const text = `${input.subject}\n${input.description}`;
  const { category, score } = pickCategory(text, input);
  const priority = pickPriority(text, category, input);
  return {
    category,
    priority,
    // Rough signal strength; rules are never as confident as a model that read the ticket.
    confidence: Math.min(0.3 + score * 0.04, 0.6),
    reasoning: score > 0 ? `Keyword match for ${category}.` : 'No strong keyword signal; defaulted.',
  };
}
