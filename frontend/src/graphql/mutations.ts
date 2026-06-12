import { gql } from '@apollo/client';

// Creates a new Person node in the authenticated user's family tree.
// The backend sets familyTreeId from the JWT automatically.
export const CREATE_PERSON_MUTATION = gql`
  mutation CreatePerson($input: CreatePersonInput!) {
    createPerson(input: $input) {
      uuid
      fullName
      confidenceScore
      isUnknownPlaceholder
    }
  }
`;

// Creates a typed relationship edge between two existing Person nodes.
// relationshipType: "PARENT_OF" | "MARRIED_TO" | "SIBLING_OF"
// fromUuid is the subject: "fromUuid PARENT_OF toUuid" means from is the parent.
export const CREATE_RELATIONSHIP_MUTATION = gql`
  mutation CreateRelationship(
    $fromUuid: String!
    $toUuid: String!
    $relationshipType: String!
  ) {
    createRelationship(
      fromUuid: $fromUuid
      toUuid: $toUuid
      relationshipType: $relationshipType
    )
  }
`;
