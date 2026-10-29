import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import * as authApi from '../api/auth.js';
import { api } from '../api/client.js';
import { queryKeys } from '../api/query-keys.js';

const AuthContext = createContext(null);

/** The current session, or null when logged out. */
async function loadSession() {
  try {
    return await authApi.fetchSession();
  } catch (error) {
    if (error.response?.status === 401) return null;
    throw error;
  }
}

export function homePathFor(role) {
  return role === 'admin' ? '/admin/tickets' : '/books';
}

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery({
    queryKey: queryKeys.session,
    queryFn: loadSession,
    staleTime: Infinity,
  });

  // A 401 on any other call means the session expired: drop to the login screen.
  useEffect(() => {
    const interceptor = api.interceptors.response.use(undefined, (error) => {
      if (error.response?.status === 401 && !error.config?.url?.startsWith('/auth/')) {
        queryClient.setQueryData(queryKeys.session, null);
      }
      return Promise.reject(error);
    });
    return () => api.interceptors.response.eject(interceptor);
  }, [queryClient]);

  const login = useCallback(
    async (email, password) => {
      const loggedIn = await authApi.login(email, password);
      queryClient.setQueryData(queryKeys.session, loggedIn);
      return loggedIn;
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => undefined);
    // Update the session in place so the mounted useQuery sees it and the route guards redirect.
    // (queryClient.clear() would detach that observer and leave the UI looking logged in.)
    queryClient.setQueryData(queryKeys.session, null);
    // Drop every other cached query so the next user never sees the previous user's data.
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== queryKeys.session[0] });
  }, [queryClient]);

  const value = useMemo(() => ({ user: user ?? null, isLoading, login, logout }), [user, isLoading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
