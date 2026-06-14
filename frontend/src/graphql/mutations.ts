import { gql } from '@apollo/client';

// Creates a new Person node in the authenticated user's family tree.
// The backend sets familyTreeId from the JWT automatically.
export const CREATE_PERSON_MUTATION = gql`
  mutation CreatePerson($input: CreatePersonInput!) {
    createPerson(input: $input) {
      uuid
      fullName
      bio
      confidenceScore
      isUnknownPlaceholder
    }
  }
`;

export const UPDATE_PERSON_MUTATION = gql`
  mutation UpdatePerson($uuid: String!, $input: UpdatePersonInput!) {
    updatePerson(uuid: $uuid, input: $input) {
      uuid
      fullName
      bio
      birthDate
      deathDate
      birthplace
      ethnicGroup
      biologicalSex
      createdAt
      canEditDetails
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

// Sets or clears the parentRole on a PARENT_OF edge.
// parentRole: "MOTHER" | "FATHER" | null (null clears it back to unspecified)
// fromUuid is the parent, toUuid is the child — same direction as the PARENT_OF edge.
export const UPDATE_PARENT_ROLE_MUTATION = gql`
  mutation UpdateParentRole($fromUuid: String!, $toUuid: String!, $parentRole: String) {
    updateParentRole(fromUuid: $fromUuid, toUuid: $toUuid, parentRole: $parentRole)
  }
`;

export const DELETE_PERSON_MUTATION = gql`
  mutation DeletePerson($uuid: String!) {
    deletePerson(uuid: $uuid)
  }
`;

export const DELETE_RELATIONSHIP_MUTATION = gql`
  mutation DeleteRelationship(
    $anchorUuid: String!
    $fromUuid: String!
    $toUuid: String!
    $relationshipType: String!
  ) {
    deleteRelationship(
      anchorUuid: $anchorUuid
      fromUuid: $fromUuid
      toUuid: $toUuid
      relationshipType: $relationshipType
    )
  }
`;
