import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client';

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

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export default client;
