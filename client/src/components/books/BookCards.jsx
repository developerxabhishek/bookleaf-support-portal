import { MessageSquare } from 'lucide-react';
import { Link } from 'react-router';
import { formatDate, formatINR } from '../../lib/format.js';

function Field({ label, children, highlight = false }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={`text-sm font-medium ${highlight ? 'text-amber-700' : 'text-slate-800'}`}>{children}</dd>
    </div>
  );
}

function AskLink({ bookId }) {
  return (
    <Link to={`/tickets/new?bookId=${bookId}`} className="btn btn-ghost -mr-2 px-2 text-brand-700">
      <MessageSquare className="size-4" /> Ask about this book
    </Link>
  );
}

export function PublishedBookCard({ book }) {
  return (
    <article className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-900">{book.title}</h3>
          <p className="text-sm text-slate-500">
            {book.genre} · ISBN {book.isbn}
          </p>
        </div>
        <span className="badge bg-emerald-50 text-emerald-700 ring-emerald-200">{book.status}</span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <Field label="Published">{formatDate(book.publicationDate)}</Field>
        <Field label="MRP">{formatINR(book.mrp)}</Field>
        <Field label="Royalty per copy">{formatINR(book.authorRoyaltyPerCopy)}</Field>
        <Field label="Copies sold">{book.totalCopiesSold.toLocaleString('en-IN')}</Field>
        <Field label="Royalty earned">{formatINR(book.totalRoyaltyEarned)}</Field>
        <Field label="Royalty paid">{formatINR(book.royaltyPaid)}</Field>
        <Field label="Royalty pending" highlight={book.royaltyPending > 0}>
          {formatINR(book.royaltyPending)}
        </Field>
        <Field label="Last payout">{book.lastRoyaltyPayoutDate ? formatDate(book.lastRoyaltyPayoutDate) : 'No payout yet'}</Field>
      </dl>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <div className="flex flex-wrap gap-1.5">
          {book.availableOn.map((platform) => (
            <span key={platform} className="badge bg-slate-50 text-slate-600 ring-slate-200">
              {platform}
            </span>
          ))}
        </div>
        <AskLink bookId={book.id} />
      </div>
    </article>
  );
}

export function ProductionBookCard({ book }) {
  const { name, step, totalSteps } = book.productionStage;

  return (
    <article className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-900">{book.title}</h3>
          <p className="text-sm text-slate-500">
            {book.genre} · ISBN {book.isbn}
          </p>
        </div>
        <span className="badge bg-amber-50 text-amber-800 ring-amber-200">In production</span>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-sm">
          <span className="font-medium text-slate-800">Current stage: {name}</span>
          {step && (
            <span className="text-slate-500">
              Step {step} of {totalSteps}
            </span>
          )}
        </div>
        {step && (
          <div className="flex gap-1" aria-hidden="true">
            {Array.from({ length: totalSteps }, (_, index) => (
              <span key={index} className={`h-1.5 flex-1 rounded-full ${index < step ? 'bg-brand-500' : 'bg-slate-200'}`} />
            ))}
          </div>
        )}
        <p className="mt-3 text-sm text-slate-500">
          Sales and royalty details will appear here once your book is published and live.
        </p>
      </div>

      <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
        <AskLink bookId={book.id} />
      </div>
    </article>
  );
}
