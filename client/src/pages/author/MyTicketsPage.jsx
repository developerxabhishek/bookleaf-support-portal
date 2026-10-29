import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { MessageSquare, Plus, Ticket } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { queryKeys } from '../../api/query-keys.js';
import { fetchTickets } from '../../api/tickets.js';
import { CategoryBadge, StatusBadge } from '../../components/Badges.jsx';
import Pagination from '../../components/Pagination.jsx';
import { EmptyState, ErrorState, PageHeader, PageLoader } from '../../components/States.jsx';
import { ACTIVE_STATUSES, TICKET_STATUSES } from '../../lib/constants.js';
import { timeAgo } from '../../lib/format.js';

const TABS = [{ label: 'All', value: 'all' }, ...TICKET_STATUSES.map((status) => ({ label: status, value: status }))];

export default function MyTicketsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? 'all';
  const page = Number(searchParams.get('page') ?? 1);
  const params = { status, page, limit: 10 };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.tickets(params),
    queryFn: () => fetchTickets(params),
    placeholderData: keepPreviousData,
  });

  const newTicketButton = (
    <Link to="/tickets/new" className="btn btn-primary">
      <Plus className="size-4" /> Raise a query
    </Link>
  );

  return (
    <>
      <PageHeader title="My Tickets" subtitle="Replies from our team appear here automatically." action={newTicketButton} />

      <div className="mb-4 flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setSearchParams(tab.value === 'all' ? {} : { status: tab.value })}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              status === tab.value ? 'border-brand-700 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageLoader />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : data.data.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title={status === 'all' ? 'No tickets yet' : `No ${status.toLowerCase()} tickets`}
          description="Questions about royalties, ISBNs, printing, distribution or your book's progress? Raise a query and we'll help."
          action={status === 'all' ? newTicketButton : null}
        />
      ) : (
        <>
          <ul className="card divide-y divide-slate-100">
            {data.data.map((ticket) => {
              const hasNewReply = ticket.lastMessageBy === 'admin' && ACTIVE_STATUSES.includes(ticket.status);
              return (
                <li key={ticket.id}>
                  <Link to={`/tickets/${ticket.id}`} className="flex flex-wrap items-center gap-3 px-5 py-4 hover:bg-slate-50">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-slate-400">#{ticket.ticketNumber}</span>
                        <span className="truncate font-medium text-slate-900">{ticket.subject}</span>
                        {hasNewReply && (
                          <span className="badge bg-brand-50 text-brand-700 ring-brand-200">
                            <MessageSquare className="size-3" /> BookLeaf replied
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {ticket.book?.title ?? 'General / Account Level'} · Updated {timeAgo(ticket.lastActivityAt)}
                      </p>
                    </div>
                    <CategoryBadge category={ticket.category} />
                    <StatusBadge status={ticket.status} />
                  </Link>
                </li>
              );
            })}
          </ul>
          <Pagination
            meta={data.meta}
            onPageChange={(next) => setSearchParams({ ...(status !== 'all' ? { status } : {}), page: String(next) })}
          />
        </>
      )}
    </>
  );
}
