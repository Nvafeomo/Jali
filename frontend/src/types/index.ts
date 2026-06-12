export interface Person {
  id: string;
  fullName: string;
  aliases?: string[];
  birthDate?: string;
  birthDateApproximate?: boolean;
  deathDate?: string;
  birthplace?: string;
  ethnicGroup?: string;
  language?: string;
  biologicalSex?: string;
  confidenceScore: number;
  isUnknownPlaceholder: boolean;
  photoUrl?: string;
  bio?: string;
  parents?: RelationshipEdge[];
  children?: RelationshipEdge[];
  spouses?: RelationshipEdge[];
  siblings?: RelationshipEdge[];
}

export interface RelationshipEdge {
  person: Person;
  type: 'PARENT_OF' | 'MARRIED_TO' | 'SIBLING_OF' | 'POSSIBLY_RELATED_TO';
  confidenceScore: number;
  disputed: boolean;
  evidenceList?: Evidence[];
}

export interface Evidence {
  type:
    | 'DNA_MATCH'
    | 'ORAL_HISTORY'
    | 'HISTORICAL_RECORD'
    | 'CORROBORATION'
    | 'DISPUTE'
    | 'CULTURAL_CONSISTENCY'
    | 'AI_NAMING';
  weight: number;
  source?: string;
  submittedAt: string;
}

export interface FamilyTree {
  id: string;
  name: string;
  originRegion?: string;
  people: Person[];
}
