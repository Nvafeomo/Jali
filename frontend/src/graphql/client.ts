import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client';

// The URL where your Spring Boot GraphQL API lives.
// In dev this points to localhost; in production this will be your deployed backend URL.
const httpLink = createHttpLink({
  uri: 'http://localhost:8080/graphql',
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
