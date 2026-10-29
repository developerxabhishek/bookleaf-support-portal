import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../api/client.js';
import { queryKeys } from '../api/query-keys.js';
import { useToast } from '../components/Toaster.jsx';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Subscribes to the server's SSE stream and keeps TanStack Query caches fresh.
 * Events only carry IDs; we invalidate the affected queries and let them
 * refetch through the normal (access-controlled) API.
 *
 * Returns whether the stream is currently connected.
 */
export function useTicketEvents() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) return undefined;

    const source = new EventSource(`${API_BASE_URL}/events`, { withCredentials: true });

    const refresh = (ticketId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ticketLists });
      queryClient.invalidateQueries({ queryKey: queryKeys.queueSummary });
      if (ticketId) queryClient.invalidateQueries({ queryKey: queryKeys.ticket(ticketId) });
    };

    const on = (type, handler) =>
      source.addEventListener(type, (event) => handler(JSON.parse(event.data)));

    source.onopen = () => {
      setConnected(true);
      // Catch up on anything that happened while we were disconnected.
      refresh();
    };
    // EventSource reconnects on its own; we only reflect the state in the UI.
    source.onerror = () => setConnected(false);

    on('ticket.created', () => {
      refresh();
      if (user.role === 'admin') toast.info('New ticket received.');
    });
    on('ticket.updated', ({ ticketId }) => refresh(ticketId));
    on('note.created', ({ ticketId }) => refresh(ticketId));
    on('message.created', ({ ticketId, ticketNumber, senderRole }) => {
      refresh(ticketId);
      if (user.role === 'author' && senderRole === 'admin') toast.success(`BookLeaf replied on ticket #${ticketNumber}.`);
      if (user.role === 'admin' && senderRole === 'author') toast.info(`Author replied on ticket #${ticketNumber}.`);
    });

    return () => source.close();
  }, [user, queryClient, toast]);

  return connected;
}
