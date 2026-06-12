import { gql } from '@apollo/client';

// gql is a tagged template literal - it parses the string into a format
// Apollo understands. The query below asks the backend for the logged-in
// user's family tree, including each person and their immediate relationships.
//
// Notice we ask for 'parents', 'children', 'spouses', 'siblings' as nested
// fields on each Person. This is what makes GraphQL powerful - one request
// gets us the whole tree structure, not N separate requests.
//
// depth: 10 means "traverse up to 10 hops from any node". For most family
// trees this covers everything. We can make this configurable later.
export const GET_MY_TREE = gql`
  query GetMyTree {
    myTree {
      id
      name
      people {
        id
        fullName
        birthDate
        birthDateApproximate
        deathDate
        birthplace
        ethnicGroup
        biologicalSex
        confidenceScore
        isUnknownPlaceholder
        photoUrl
        parents {
          person {
            id
            fullName
          }
          confidenceScore
          disputed
        }
        children {
          person {
            id
            fullName
          }
          confidenceScore
          disputed
        }
        spouses {
          person {
            id
            fullName
          }
          confidenceScore
          disputed
        }
        siblings {
          person {
            id
            fullName
          }
          confidenceScore
          disputed
        }
      }
    }
  }
`;
