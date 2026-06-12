package com.jali.config;

import org.springframework.graphql.execution.DataFetcherExceptionResolverAdapter;
import org.springframework.graphql.execution.ErrorType;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import graphql.GraphQLError;
import graphql.GraphqlErrorBuilder;
import graphql.schema.DataFetchingEnvironment;

@Component
public class GraphQlExceptionResolver extends DataFetcherExceptionResolverAdapter {

	@Override
	protected GraphQLError resolveToSingleError(Throwable ex, DataFetchingEnvironment env) {
		ResponseStatusException rse = findResponseStatusException(ex);
		if (rse != null) {
			ErrorType errorType = mapStatus(rse.getStatusCode());
			if (errorType == null) {
				return null;
			}
			return GraphqlErrorBuilder.newError(env)
					.errorType(errorType)
					.message(rse.getReason() != null ? rse.getReason() : rse.getMessage())
					.build();
		}

		if (ex instanceof IllegalArgumentException iae) {
			return GraphqlErrorBuilder.newError(env)
					.errorType(ErrorType.BAD_REQUEST)
					.message(iae.getMessage())
					.build();
		}

		return null;
	}

	private static ResponseStatusException findResponseStatusException(Throwable ex) {
		Throwable current = ex;
		while (current != null) {
			if (current instanceof ResponseStatusException rse) {
				return rse;
			}
			current = current.getCause();
		}
		return null;
	}

	private static ErrorType mapStatus(HttpStatusCode statusCode) {
		if (statusCode instanceof HttpStatus status) {
			return switch (status) {
				case NOT_FOUND -> ErrorType.NOT_FOUND;
				case BAD_REQUEST, CONFLICT, UNPROCESSABLE_ENTITY -> ErrorType.BAD_REQUEST;
				case FORBIDDEN -> ErrorType.FORBIDDEN;
				case UNAUTHORIZED -> ErrorType.UNAUTHORIZED;
				default -> null;
			};
		}
		return null;
	}
}
