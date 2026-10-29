import { CircleAlert, LoaderCircle } from 'lucide-react';
import { errorMessage } from '../api/client.js';

export function Spinner({ className = 'size-4' }) {
  return <LoaderCircle className={`animate-spin ${className}`} aria-hidden="true" />;
}

export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-slate-400">
      <Spinner className="size-6" />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      {Icon && <Icon className="mb-3 size-10 text-slate-300" />}
      <h3 className="font-semibold text-slate-700">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      <CircleAlert className="mb-3 size-8 text-red-400" />
      <p className="text-sm text-slate-600">{errorMessage(error)}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary mt-4" onClick={() => onRetry()}>
          Try again
        </button>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
