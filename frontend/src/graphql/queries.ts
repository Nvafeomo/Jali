import { gql } from '@apollo/client';

// Fetches every person in the authenticated user's family tree.
// The backend scopes this to the JWT's familyTreeId automatically —
// no need to pass a tree ID from the frontend.
//
// myTree returns a flat [Person] list. We get children/spouses/siblings
// on each person and derive parent edges ourselves in useMyTree.
//
// The backend uses `uuid` (not `id`) as the node identifier.
export const MY_TREE_QUERY = gql`
  query MyTree {
    myTree {
      uuid
      fullName
      bio
      birthDate
      deathDate
      birthplace
      ethnicGroup
      biologicalSex
      confidenceScore
      isUnknownPlaceholder
      createdAt
      canEditDetails
      children {
        person {
          uuid
          fullName
          confidenceScore
          isUnknownPlaceholder
        }
        confidenceScore
        disputed
      }
      spouses {
        person {
          uuid
          fullName
          confidenceScore
          isUnknownPlaceholder
        }
        confidenceScore
        disputed
      }
      siblings {
        person {
          uuid
          fullName
          confidenceScore
          isUnknownPlaceholder
        }
        confidenceScore
        disputed
      }
    }
  }
`;
