import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
      <span>
        Page {meta.page} of {meta.totalPages} · {meta.total} tickets
      </span>
      <div className="flex gap-2">
        <button type="button" className="btn btn-secondary px-2.5" disabled={meta.page <= 1} onClick={() => onPageChange(meta.page - 1)}>
          <ChevronLeft className="size-4" /> Previous
        </button>
        <button
          type="button"
          className="btn btn-secondary px-2.5"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Next <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
