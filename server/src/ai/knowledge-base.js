/**
 * The BookLeaf Knowledge Base, split into sections so each LLM call only
 * carries the policies relevant to the ticket. Wording follows the policy
 * document closely: these are the facts the AI is allowed to state.
 *
 * Each section has:
 * - categories: ticket categories for which it is always included
 * - keywords:   signals that pull it in for tickets in other categories
 */

/** Small and relevant to every reply, so it lives in the static system prompt. */
export const COMPANY_OVERVIEW = `- BookLeaf Publishing is a self-publishing company operating in India and the US.
- Publishing packages: Standard Free (no upfront cost) and Bestseller Breakthrough (premium, paid package with marketing and distribution add-ons).
- BookLeaf handles cover design, typesetting, ISBN assignment, printing, distribution, and royalty management for its authors.
- In-house printing facility and warehouse in Delhi; print partners include Repro India and Epitome Books.`;

export const KB_SECTIONS = [
  {
    id: 'royalty',
    title: 'Royalty Policy',
    categories: ['Royalty & Payments'],
    keywords: [/\broyalt/i, /\bpay(ment|out|ing)?s?\b/i, /\bpaid\b/i, /\bbank\b/i, /\bearn/i, /₹|\brs\.?\s?\d/i, /\bstatement/i, /\bbreakdown/i],
    content: `- 80/20 royalty split: 80% of the net profit per book goes to the author, 20% to BookLeaf.
- Net profit = MRP minus printing cost, platform commission (Amazon/Flipkart), and shipping charges.
- Royalties are calculated quarterly and paid within 45 days of the quarter ending.
- Minimum payout threshold: ₹1,000. If accumulated royalties are below this, they roll over to the next quarter.
- Payouts are made via bank transfer to the account linked in the author's dashboard.
- Authors can view a detailed royalty breakdown in their dashboard, showing sales figures per platform.`,
  },
  {
    id: 'isbn',
    title: 'ISBN Policy',
    categories: ['ISBN & Metadata Issues'],
    keywords: [/\bisbn/i, /\bimprint\b/i, /\bbarcode/i],
    content: `- Every book published through BookLeaf receives a unique ISBN assigned by BookLeaf.
- ISBNs are registered under BookLeaf's publisher imprint. Authors who want an ISBN under their own imprint need to obtain it independently.
- ISBN errors (duplicate ISBN, wrong book linked) are treated as high priority and escalated to the production team.`,
  },
  {
    id: 'metadata',
    title: 'Metadata & Listing Updates',
    categories: ['ISBN & Metadata Issues', 'General Inquiry'],
    // Specific nouns only: generic verbs like "update" would match "any update?" on every ticket.
    keywords: [/\bdescription\b/i, /\bblurb\b/i, /\bbio\b/i, /\bmetadata\b/i, /\bkeywords?\b/i, /\bauthor name\b/i],
    content: `- Metadata updates (such as the book description) can be submitted after a book is live, through the author dashboard or by emailing the BookLeaf team.
- Changes typically reflect on platforms within 3–5 business days.`,
  },
  {
    id: 'printing',
    title: 'Printing & Quality',
    categories: ['Printing & Quality'],
    keywords: [/\bprint(ed|ing)?\b/i, /\bblurr?y\b/i, /\bbinding\b/i, /\bmisprint/i, /\bmisalign/i, /\bdefect/i, /\breprint/i, /\bauthor cop(y|ies)\b/i, /\bink\b/i],
    content: `- In-house printing (Delhi) handles most orders. Overflow or specific format requirements go to Repro India or Epitome Books.
- Standard print turnaround: 5–7 business days from order confirmation.
- Quality issues (misprints, binding defects, colour inconsistency): BookLeaf arranges a free reprint after verification. The author may need to share photos of the defective copy.`,
  },
  {
    id: 'distribution',
    title: 'Distribution & Availability',
    categories: ['Distribution & Availability'],
    keywords: [/\bamazon\b/i, /\bflipkart\b/i, /\blist(ed|ing)\b/i, /\bunavailable\b/i, /\bout of stock\b/i, /\bstock\b/i, /\bstore\b/i],
    content: `- Books are listed on Amazon India, Flipkart, Amazon US, Amazon UK, and the BookLeaf Store.
- New listings typically go live within 7–10 business days after publication is complete.
- A book showing as unavailable on a platform usually indicates a stock sync issue; BookLeaf's team can trigger a re-sync, which takes 24–48 hours.`,
  },
  {
    id: 'production',
    title: 'Production Stages',
    categories: ['Book Status & Production Updates'],
    keywords: [/\btypesett/i, /\bcover\b/i, /\bproof/i, /\bediting\b/i, /\bmanuscript/i, /\bproduction\b/i, /\bstage\b/i],
    content: `- Stages, in order: Manuscript Received → Editing (if opted) → Cover Design → Typesetting → Proofreading → ISBN Assignment → Printing → Distribution Setup → Published & Live.
- Authors are updated at each stage via email.
- Delays typically happen at Cover Design (waiting for author approval) and Proofreading (revision rounds).`,
  },
];

/**
 * How BookLeaf handles each kind of query, distilled from the sample
 * query → response table. Only the ticket's own category is sent.
 */
export const RESPONSE_PLAYBOOKS = {
  'Royalty & Payments': `- Royalty not received: acknowledge the frustration. Explain the quarterly cycle and 45-day payout window. Ask the author to confirm their bank details are linked in the dashboard. Give the specific next payout date from the account facts. If the payment is genuinely overdue, own it and escalate with a 48-hour resolution timeline.
- Royalty seems too low: explain the net-profit calculation (MRP minus printing cost, platform commission and shipping) using the author's own numbers where available. Offer a detailed line-by-line royalty breakdown. Be transparent, never defensive.`,
  'ISBN & Metadata Issues': `- ISBN errors (mismatch between listing and physical copy, duplicates, wrong book linked): treat as high priority and acknowledge it is a serious data issue. Confirm you are escalating to the production team immediately. Give a 48-hour resolution timeline.
- Requests to change listing details: confirm they can be submitted via the dashboard or by email, and that changes reflect on platforms within 3–5 business days.`,
  'Printing & Quality': `- Apologise sincerely. Ask the author to share photos of the defective copies (they can attach them to this ticket). Confirm BookLeaf will arrange a free reprint once verified. Give a reprint timeline of 5–7 business days.`,
  'Distribution & Availability': `- Book unavailable on a platform: explain this is typically a stock sync issue. Confirm you are triggering a re-sync with the distribution team. Set the expectation of 24–48 hours for it to be live again.
- Newly published book not yet listed: new listings typically go live within 7–10 business days after publication is complete.`,
  'Book Status & Production Updates': `- Use the book's actual production stage from the account facts. If it looks delayed, be honest about why (for example, waiting on author approval of the cover or proofs) and give a specific next step and timeline. Never blame the author even if the delay is on their side; frame it collaboratively.`,
  'General Inquiry': `- Answer the question directly using the policies provided. For example, metadata updates such as a new book description: yes, submit them through the dashboard or by emailing the BookLeaf team; changes typically reflect on platforms within 3–5 business days.
- If the answer isn't covered by the policies, say the team will confirm and give a clear timeline.`,
};

const MAX_SECTIONS = 3;

/**
 * Picks the KB sections for a ticket: every section mapped to its category,
 * plus sections whose keywords appear in the text (for tickets that span
 * topics), capped so the prompt stays small.
 *
 * With a ~1.2k-token KB this simple routing beats embeddings on cost and
 * predictability; a larger KB would move to vector retrieval.
 */
export function selectKnowledge(category, text) {
  const scored = KB_SECTIONS.map((section) => {
    const keywordHits = section.keywords.filter((pattern) => pattern.test(text)).length;
    const categoryMatch = section.categories.includes(category);
    return { section, score: (categoryMatch ? 100 : 0) + keywordHits };
  });

  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SECTIONS)
    .map(({ section }) => section);
}
