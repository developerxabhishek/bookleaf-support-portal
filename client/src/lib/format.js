import { ACTIVE_STATUSES, RESPONSE_TARGET_HOURS } from './constants.js';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export function formatINR(amount) {
  return amount === null || amount === undefined ? '—' : inr.format(amount);
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function hoursSince(value) {
  return (Date.now() - new Date(value).getTime()) / 3_600_000;
}

export function timeAgo(value) {
  const minutes = Math.round(hoursSince(value) * 60);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

/** Compact duration, e.g. "<1h", "5h", "3d". */
export function formatHours(hours) {
  if (hours < 1) return '<1h';
  if (hours < 24) return `${Math.floor(hours)}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * How long an active ticket has been waiting on the support team, against its
 * priority's response target. Null when the ticket isn't waiting on us.
 */
export function responseWait(ticket) {
  if (!ACTIVE_STATUSES.includes(ticket.status) || ticket.lastMessageBy !== 'author') return null;
  const waited = hoursSince(ticket.lastActivityAt ?? ticket.createdAt);
  const target = RESPONSE_TARGET_HOURS[ticket.priority] ?? 48;
  const state = waited >= target ? 'overdue' : waited >= target * 0.75 ? 'due-soon' : 'ok';
  return { waited, target, state };
}
