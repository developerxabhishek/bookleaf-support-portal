import { useQuery } from '@tanstack/react-query';
import { LibraryBig, Plus } from 'lucide-react';
import { Link } from 'react-router';
import { fetchMyBooks } from '../../api/books.js';
import { queryKeys } from '../../api/query-keys.js';
import { ProductionBookCard, PublishedBookCard } from '../../components/books/BookCards.jsx';
import RoyaltySummary from '../../components/books/RoyaltySummary.jsx';
import { EmptyState, ErrorState, PageHeader, PageLoader } from '../../components/States.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function MyBooksPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: queryKeys.books, queryFn: fetchMyBooks });

  const header = (
    <PageHeader
      title="My Books"
      subtitle={`Welcome back, ${user.name.split(' ')[0]}.`}
      action={
        <Link to="/tickets/new" className="btn btn-primary">
          <Plus className="size-4" /> Raise a query
        </Link>
      }
    />
  );

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const books = data.data;
  const inProduction = books.filter((book) => !book.productionStage.isPublished);
  const published = books.filter((book) => book.productionStage.isPublished);

  if (books.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon={LibraryBig}
          title="No books yet"
          description="Once your manuscript is with us, your books and their progress will show up here."
        />
      </>
    );
  }

  return (
    <>
      {header}
      <div className="space-y-8">
        <RoyaltySummary summary={data.summary} />

        {inProduction.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">In production</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {inProduction.map((book) => (
                <ProductionBookCard key={book.id} book={book} />
              ))}
            </div>
          </section>
        )}

        {published.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">Published</h2>
            <div className="grid gap-4">
              {published.map((book) => (
                <PublishedBookCard key={book.id} book={book} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
