import { Navigate, Route, Routes } from 'react-router';
import Layout from './components/Layout.jsx';
import { RequireRole } from './components/RequireRole.jsx';
import { PageLoader } from './components/States.jsx';
import { homePathFor, useAuth } from './context/AuthContext.jsx';
import TicketQueuePage from './pages/admin/TicketQueuePage.jsx';
import TicketWorkspacePage from './pages/admin/TicketWorkspacePage.jsx';
import AuthorTicketPage from './pages/author/AuthorTicketPage.jsx';
import MyBooksPage from './pages/author/MyBooksPage.jsx';
import MyTicketsPage from './pages/author/MyTicketsPage.jsx';
import NewTicketPage from './pages/author/NewTicketPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

function HomeRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  return <Navigate to={user ? homePathFor(user.role) : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <RequireRole role="author">
            <Layout />
          </RequireRole>
        }
      >
        <Route path="/books" element={<MyBooksPage />} />
        <Route path="/tickets" element={<MyTicketsPage />} />
        <Route path="/tickets/new" element={<NewTicketPage />} />
        <Route path="/tickets/:id" element={<AuthorTicketPage />} />
      </Route>

      <Route
        element={
          <RequireRole role="admin">
            <Layout />
          </RequireRole>
        }
      >
        <Route path="/admin/tickets" element={<TicketQueuePage />} />
        <Route path="/admin/tickets/:id" element={<TicketWorkspacePage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
