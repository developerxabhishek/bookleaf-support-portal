import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { queryKeys } from '../../api/query-keys.js';
import { fetchTicket } from '../../api/tickets.js';
import AuthorContextCard from '../../components/admin/AuthorContextCard.jsx';
import DraftComposer from '../../components/admin/DraftComposer.jsx';
import NotesPanel from '../../components/admin/NotesPanel.jsx';
import TicketControls from '../../components/admin/TicketControls.jsx';
import { CategoryBadge, PriorityBadge, StatusBadge } from '../../components/Badges.jsx';
import { ErrorState, PageLoader } from '../../components/States.jsx';
import MessageThread from '../../components/tickets/MessageThread.jsx';
import OriginalQuery from '../../components/tickets/OriginalQuery.jsx';
import { timeAgo } from '../../lib/format.js';

export default function TicketWorkspacePage() {
  const { id } = useParams();
  const { data: ticket, isLoading, error, refetch } = useQuery({ queryKey: queryKeys.ticket(id), queryFn: () => fetchTicket(id) });

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-5">
      <Link to="/admin/tickets" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="size-4" /> Ticket queue
      </Link>

      <header>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-400">#{ticket.ticketNumber}</span>
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
          <CategoryBadge category={ticket.category} />
        </div>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">{ticket.subject}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {ticket.author.name} · {ticket.book?.title ?? 'General / Account Level'} · raised {timeAgo(ticket.createdAt)}
        </p>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <OriginalQuery ticket={ticket} authorName={ticket.author.name} />
          <MessageThread messages={ticket.messages} viewerRole="admin" />
          {/* Remount per ticket so editor state never leaks between tickets. */}
          <DraftComposer key={ticket.id} ticket={ticket} />
        </div>
        <aside className="space-y-5">
          <TicketControls ticket={ticket} />
          <NotesPanel ticket={ticket} />
          <AuthorContextCard context={ticket.authorContext} focusBookId={ticket.book?.id} />
        </aside>
      </div>
    </div>
  );
}
