/**
 * Royalty rules from the BookLeaf knowledge base, computed in code so that
 * dates and thresholds are exact. The LLM is given these results as facts
 * instead of being asked to do date arithmetic.
 */

export const MIN_PAYOUT_THRESHOLD = 1000;
export const PAYOUT_WINDOW_DAYS = 45;
/** One quarter plus the payout window: longer than this without a payout is suspicious. */
const OVERDUE_AFTER_DAYS = 90 + PAYOUT_WINDOW_DAYS;

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS);
}

/**
 * Payout cycle for the calendar quarter `quarterIndex` (0–3) of `year`:
 * { label: "Q3 2026 (Jul–Sep)", quarterEnd, payoutDueBy }
 */
function cycleFor(year, quarterIndex) {
  const firstMonth = quarterIndex * 3;
  // Day 0 of the month after the quarter = last day of the quarter.
  const quarterEnd = new Date(Date.UTC(year, firstMonth + 3, 0));
  return {
    label: `Q${quarterIndex + 1} ${year} (${MONTHS[firstMonth]}–${MONTHS[firstMonth + 2]})`,
    quarterEnd,
    payoutDueBy: addDays(quarterEnd, PAYOUT_WINDOW_DAYS),
  };
}

/**
 * Royalties are calculated per calendar quarter and paid within 45 days of the quarter ending.
 * Returns the most recently closed quarter, the current quarter, and the next payout deadline
 * (the closed quarter's, if its payout window is still open).
 */
export function getPayoutSchedule(today = new Date()) {
  const year = today.getUTCFullYear();
  const quarterIndex = Math.floor(today.getUTCMonth() / 3);

  const currentQuarter = cycleFor(year, quarterIndex);
  const lastClosedQuarter = quarterIndex === 0 ? cycleFor(year - 1, 3) : cycleFor(year, quarterIndex - 1);

  const nextPayoutBy =
    today <= lastClosedQuarter.payoutDueBy ? lastClosedQuarter.payoutDueBy : currentQuarter.payoutDueBy;

  return { lastClosedQuarter, currentQuarter, nextPayoutBy };
}

/**
 * Heuristic: royalties are pending, the account is above the payout threshold, and
 * more than a full cycle (quarter + 45 days) has passed since the last payout (or
 * since publication if never paid). Real systems would check the payout ledger.
 */
export function isPayoutLikelyOverdue(book, accountPending, today = new Date()) {
  if (book.royaltyPending <= 0 || accountPending < MIN_PAYOUT_THRESHOLD) return false;
  const reference = book.lastRoyaltyPayoutDate ?? book.publicationDate;
  if (!reference) return false;
  return today.getTime() - reference.getTime() > OVERDUE_AFTER_DAYS * DAY_MS;
}

/** Account-level totals across an author's books, plus threshold and next payout date. */
export function summarizeRoyalties(books, today = new Date()) {
  const sum = (pick) => books.reduce((acc, book) => acc + pick(book), 0);
  const totalRoyaltyPending = sum((b) => b.royaltyPending);
  const schedule = getPayoutSchedule(today);
  const nextCycle =
    schedule.nextPayoutBy.getTime() === schedule.lastClosedQuarter.payoutDueBy.getTime()
      ? schedule.lastClosedQuarter
      : schedule.currentQuarter;

  return {
    totalCopiesSold: sum((b) => b.totalCopiesSold),
    totalRoyaltyEarned: sum((b) => b.totalRoyaltyEarned),
    totalRoyaltyPaid: sum((b) => b.royaltyPaid),
    totalRoyaltyPending,
    payoutThreshold: MIN_PAYOUT_THRESHOLD,
    meetsPayoutThreshold: totalRoyaltyPending >= MIN_PAYOUT_THRESHOLD,
    nextPayout: { quarterLabel: nextCycle.label, payoutDueBy: nextCycle.payoutDueBy },
  };
}
