import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Inbox, Paperclip } from 'lucide-react';
import { useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { queryKeys } from '../../api/query-keys.js';
import { fetchQueueSummary, fetchTickets } from '../../api/tickets.js';
import QueueFilters from '../../components/admin/QueueFilters.jsx';
import QueueSummaryBar from '../../components/admin/QueueSummaryBar.jsx';
import { PriorityBadge, SourceTag, StatusBadge } from '../../components/Badges.jsx';
import Pagination from '../../components/Pagination.jsx';
import { EmptyState, ErrorState, PageHeader, PageLoader, Spinner } from '../../components/States.jsx';
import { formatHours, responseWait, timeAgo } from '../../lib/format.js';

/** The queue opens on active tickets, most urgent (then longest-waiting) first. */
const DEFAULT_FILTERS = { status: 'active', sort: 'urgency' };

const WAIT_STYLES = {
  overdue: 'text-red-600 font-semibold',
  'due-soon': 'text-amber-600 font-medium',
  ok: 'text-slate-600',
};

function WaitingCell({ ticket }) {
  const wait = responseWait(ticket);
  return (
    <div className="text-xs">
      {wait ? (
        <p className={WAIT_STYLES[wait.state]} title={`Response target for ${ticket.priority}: ${wait.target}h`}>
          Waiting {formatHours(wait.waited)}
          {wait.state === 'overdue' && ' · overdue'}
        </p>
      ) : (
        <p className="text-slate-400">{ticket.lastMessageBy === 'admin' ? 'Replied' : '—'}</p>
      )}
      <p className="text-slate-400">Raised {timeAgo(ticket.createdAt)}</p>
    </div>
  );
}

export default function TicketQueuePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlFilters = Object.fromEntries([...searchParams].filter(([, value]) => value));
  const filters = { ...DEFAULT_FILTERS, ...urlFilters };
  const params = { ...filters, page: Number(filters.page ?? 1), limit: 20 };
  const isFiltered = Object.keys(urlFilters).some((key) => key !== 'page');

  const tickets = useQuery({
    queryKey: queryKeys.tickets(params),
    queryFn: () => fetchTickets(params),
    placeholderData: keepPreviousData,
  });
  const summary = useQuery({ queryKey: queryKeys.queueSummary, queryFn: fetchQueueSummary });

  const setFilter = useCallback(
    (key, value) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        if (!value || value === DEFAULT_FILTERS[key]) next.delete(key);
        else next.set(key, value);
        if (key !== 'page') next.delete('page');
        return next;
      });
    },
    [setSearchParams],
  );

  return (
    <>
      <PageHeader
        title="Ticket queue"
        subtitle="Most urgent and longest-waiting tickets first."
        action={tickets.isFetching && !tickets.isLoading ? <Spinner className="size-4 text-slate-400" /> : null}
      />

      <QueueSummaryBar summary={summary.data} onSelect={(preset) => setSearchParams(preset)} />
      <QueueFilters filters={filters} onChange={setFilter} onReset={() => setSearchParams({})} isFiltered={isFiltered} />

      {tickets.isLoading ? (
        <PageLoader />
      ) : tickets.error ? (
        <ErrorState error={tickets.error} onRetry={tickets.refetch} />
      ) : tickets.data.data.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={isFiltered ? 'No tickets match these filters' : 'The queue is clear'}
          description={isFiltered ? 'Try widening the filters.' : 'New tickets will appear here automatically.'}
        />
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Ticket</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Assignee</th>
                  <th className="px-4 py-3 font-medium">Waiting</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.data.data.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                    className={`cursor-pointer hover:bg-slate-50 ${ticket.priority === 'Critical' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-transparent'}`}
                  >
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col items-start gap-1">
                        <PriorityBadge priority={ticket.priority} />
                        <SourceTag source={ticket.prioritySource} />
                      </div>
                    </td>
                    <td className="max-w-md px-4 py-3 align-top">
                      <Link
                        to={`/admin/tickets/${ticket.id}`}
                        className="font-medium text-slate-900 hover:text-brand-700"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <span className="mr-1 text-slate-400">#{ticket.ticketNumber}</span>
                        {ticket.subject}
                      </Link>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                        {ticket.author.name} · {ticket.book?.title ?? 'General / Account'}
                        {ticket.attachmentCount > 0 && (
                          <span className="inline-flex items-center gap-0.5" title="Has attachments">
                            · <Paperclip className="size-3" />
                            {ticket.attachmentCount}
                          </span>
                        )}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="text-slate-700">{ticket.category}</p>
                      {ticket.triageStatus === 'pending' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-violet-600">
                          <Spinner className="size-3" /> AI classifying…
                        </span>
                      ) : (
                        <SourceTag source={ticket.categorySource} />
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-4 py-3 align-top text-slate-600">
                      {ticket.assignee?.name ?? <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <WaitingCell ticket={ticket} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={tickets.data.meta} onPageChange={(page) => setFilter('page', String(page))} />
        </>
      )}
    </>
  );
}
