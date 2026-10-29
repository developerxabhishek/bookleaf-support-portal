import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Lock, Send } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { errorMessage } from '../../api/client.js';
import { queryKeys } from '../../api/query-keys.js';
import { addMessage, fetchTicket } from '../../api/tickets.js';
import { CategoryBadge, StatusBadge } from '../../components/Badges.jsx';
import { ErrorState, PageLoader, Spinner } from '../../components/States.jsx';
import MessageThread from '../../components/tickets/MessageThread.jsx';
import OriginalQuery from '../../components/tickets/OriginalQuery.jsx';
import { useToast } from '../../components/Toaster.jsx';

function ReplyBox({ ticket }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [body, setBody] = useState('');

  const mutation = useMutation({
    mutationFn: () => addMessage(ticket.id, { body }),
    onSuccess: () => {
      setBody('');
      queryClient.invalidateQueries({ queryKey: queryKeys.ticket(ticket.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.ticketLists });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (ticket.status === 'Closed') {
    return (
      <p className="card flex items-center gap-2 p-4 text-sm text-slate-500">
        <Lock className="size-4" />
        This ticket is closed.{' '}
        <Link to="/tickets/new" className="font-medium text-brand-700 hover:underline">
          Raise a new query
        </Link>{' '}
        if you need more help.
      </p>
    );
  }

  return (
    <form
      className="card p-4"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
    >
      <label htmlFor="reply" className="label">
        Add a reply
      </label>
      <textarea
        id="reply"
        className="input min-h-24"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Anything else we should know?"
        maxLength={5000}
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500">{ticket.status === 'Resolved' ? 'Replying will reopen this ticket.' : ''}</p>
        <button type="submit" className="btn btn-primary" disabled={!body.trim() || mutation.isPending}>
          {mutation.isPending ? <Spinner /> : <Send className="size-4" />}
          Send
        </button>
      </div>
    </form>
  );
}

export default function AuthorTicketPage() {
  const { id } = useParams();
  const { data: ticket, isLoading, error, refetch } = useQuery({ queryKey: queryKeys.ticket(id), queryFn: () => fetchTicket(id) });

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/tickets" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="size-4" /> My tickets
      </Link>

      <header>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-400">#{ticket.ticketNumber}</span>
          <StatusBadge status={ticket.status} />
          <CategoryBadge category={ticket.category} />
        </div>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">{ticket.subject}</h1>
        <p className="mt-1 text-sm text-slate-500">{ticket.book?.title ?? 'General / Account Level'}</p>
      </header>

      <OriginalQuery ticket={ticket} />

      {ticket.messages.length > 0 ? (
        <MessageThread messages={ticket.messages} viewerRole="author" />
      ) : (
        <p className="text-center text-sm text-slate-500">
          Our team has received your query. Their reply will appear here automatically.
        </p>
      )}

      <ReplyBox ticket={ticket} />
    </div>
  );
}
