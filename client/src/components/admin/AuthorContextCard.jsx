import { Mail, MapPin, Phone } from 'lucide-react';
import { formatDate, formatINR } from '../../lib/format.js';

export default function AuthorContextCard({ context, focusBookId }) {
  const summary = context.royaltySummary;

  return (
    <section className="card p-5">
      <h2 className="font-semibold text-slate-900">{context.name}</h2>
      <ul className="mt-2 space-y-1 text-sm text-slate-600">
        <li className="flex items-center gap-2">
          <Mail className="size-3.5 text-slate-400" />
          <a href={`mailto:${context.email}`} className="hover:text-brand-700">
            {context.email}
          </a>
        </li>
        {context.phone && (
          <li className="flex items-center gap-2">
            <Phone className="size-3.5 text-slate-400" /> {context.phone}
          </li>
        )}
        {context.city && (
          <li className="flex items-center gap-2">
            <MapPin className="size-3.5 text-slate-400" /> {context.city} · author since {formatDate(context.joinedAt)}
          </li>
        )}
      </ul>

      {summary && (
        <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Royalty pending</span>
            <span className={`font-semibold ${summary.totalRoyaltyPending > 0 ? 'text-amber-700' : 'text-slate-800'}`}>
              {formatINR(summary.totalRoyaltyPending)}
            </span>
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-slate-500">Paid to date</span>
            <span className="font-medium text-slate-800">{formatINR(summary.totalRoyaltyPaid)}</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {summary.meetsPayoutThreshold
              ? `Above the ${formatINR(summary.payoutThreshold)} threshold. Next payout window closes ${formatDate(summary.nextPayout.payoutDueBy)}.`
              : summary.totalRoyaltyPending > 0
                ? `Below the ${formatINR(summary.payoutThreshold)} threshold, so it rolls over to next quarter.`
                : 'Fully paid up.'}
          </p>
        </div>
      )}

      <h3 className="mt-4 mb-2 text-xs font-medium tracking-wide text-slate-500 uppercase">Books ({context.books.length})</h3>
      <ul className="space-y-2">
        {context.books.map((book) => {
          const isFocus = book.id === focusBookId;
          return (
            <li key={book.id} className={`rounded-lg border px-3 py-2 text-sm ${isFocus ? 'border-brand-200 bg-brand-50' : 'border-slate-200'}`}>
              <p className="font-medium text-slate-800">
                {book.title}
                {isFocus && <span className="ml-1 text-xs font-normal text-brand-700">(this ticket)</span>}
              </p>
              {book.productionStage.isPublished ? (
                <p className="text-xs text-slate-500">
                  {book.totalCopiesSold} sold · {formatINR(book.royaltyPending)} pending · last payout{' '}
                  {book.lastRoyaltyPayoutDate ? formatDate(book.lastRoyaltyPayoutDate) : 'never'}
                </p>
              ) : (
                <p className="text-xs text-amber-700">
                  In production: {book.productionStage.name}
                  {book.productionStage.step && ` (step ${book.productionStage.step}/${book.productionStage.totalSteps})`}
                </p>
              )}
              <p className="text-xs text-slate-400">ISBN {book.isbn}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
