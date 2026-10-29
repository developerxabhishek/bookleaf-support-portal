import { CalendarClock, Info } from 'lucide-react';
import { formatDate, formatINR } from '../../lib/format.js';

function Stat({ label, value, tone = 'text-slate-900' }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function payoutMessage(summary) {
  const { totalRoyaltyPending, meetsPayoutThreshold, payoutThreshold, nextPayout } = summary;
  if (totalRoyaltyPending === 0) {
    return "You're fully paid up. New royalties are calculated at the end of each quarter.";
  }
  if (!meetsPayoutThreshold) {
    return `Your pending ${formatINR(totalRoyaltyPending)} is below the ${formatINR(payoutThreshold)} minimum payout, so it rolls over to the next quarter.`;
  }
  return `Royalties are calculated quarterly and paid within 45 days of the quarter ending. The payout window for ${nextPayout.quarterLabel} closes on ${formatDate(nextPayout.payoutDueBy)}.`;
}

export default function RoyaltySummary({ summary }) {
  return (
    <section>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Copies sold" value={summary.totalCopiesSold.toLocaleString('en-IN')} />
        <Stat label="Royalty earned" value={formatINR(summary.totalRoyaltyEarned)} />
        <Stat label="Royalty paid" value={formatINR(summary.totalRoyaltyPaid)} tone="text-emerald-700" />
        <Stat
          label="Royalty pending"
          value={formatINR(summary.totalRoyaltyPending)}
          tone={summary.totalRoyaltyPending > 0 ? 'text-amber-700' : 'text-slate-900'}
        />
      </div>
      <p className="mt-3 flex items-start gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
        {summary.meetsPayoutThreshold ? <CalendarClock className="mt-0.5 size-4 shrink-0" /> : <Info className="mt-0.5 size-4 shrink-0" />}
        {payoutMessage(summary)}
      </p>
    </section>
  );
}
