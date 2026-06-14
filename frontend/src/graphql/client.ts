import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client';
import { RetryLink } from '@apollo/client/link/retry';

// VITE_API_URL is set at build time.
// In dev it defaults to localhost. In production, Vercel (or your host) injects
// the real backend URL via the VITE_API_URL environment variable.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

const httpLink = createHttpLink({
  uri: `${API_URL}/graphql`,
});

// This middleware runs before every GraphQL request and attaches the JWT token.
// After login we store the token in localStorage; Apollo reads it here
// and adds it to the Authorization header automatically on every request.
const authLink = new ApolloLink((operation, forward) => {
  const token = localStorage.getItem('jali_token');
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  }));
  return forward(operation);
});

/** Retry cold-start / transient network failures (e.g. Render waking up). */
const retryLink = new RetryLink({
  delay: { initial: 800, max: 4000, jitter: true },
  attempts: {
    max: 3,
    retryIf: (error, _operation) => {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 401 || status === 403) return false;
      return true;
    },
  },
});

const client = new ApolloClient({
  link: authLink.concat(retryLink).concat(httpLink),
  cache: new InMemoryCache(),
});

export default client;
