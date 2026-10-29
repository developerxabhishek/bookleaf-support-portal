import { useMutation } from '@tanstack/react-query';
import { CircleAlert } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { errorMessage } from '../api/client.js';
import { Spinner } from '../components/States.jsx';
import { homePathFor, useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: (loggedIn) => navigate(location.state?.from ?? homePathFor(loggedIn.role), { replace: true }),
  });

  if (user && !mutation.isPending) return <Navigate to={homePathFor(user.role)} replace />;

  function handleSubmit(event) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand-700 text-lg font-bold text-white">B</span>
          <div>
            <p className="text-lg font-semibold text-slate-900">BookLeaf Publishing</p>
            <p className="text-xs text-slate-500">Author Support Portal</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          <h1 className="text-lg font-semibold text-slate-900">Log in</h1>

          {mutation.isError && (
            <p className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              <CircleAlert className="size-4 shrink-0" />
              {errorMessage(mutation.error)}
            </p>
          )}

          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="label">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              className="input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={mutation.isPending}>
            {mutation.isPending && <Spinner />}
            Log in
          </button>
        </form>
      </div>
    </div>
  );
}
