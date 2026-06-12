export interface Person {
  id: string;
  fullName: string;
  aliases?: string[];
  bio?: string;
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
  createdAt?: string;
  canEditDetails?: boolean;
  parents?: RelationshipEdge[];
  children?: RelationshipEdge[];
  spouses?: RelationshipEdge[];
  siblings?: RelationshipEdge[];
  stories?: StoryMemory[];
}

export interface RelationshipEdge {
  person: Person;
  type: 'PARENT_OF' | 'MARRIED_TO' | 'SIBLING_OF' | 'POSSIBLY_RELATED_TO';
  confidenceScore: number;
  disputed: boolean;
  evidenceList?: Evidence[];
}

// A story can be a voice memo (has audio) or a written memory (text only).
// Both go through Claude for entity extraction, but AUDIO goes through
// Whisper first. The UI uses memoryType to decide whether to show an audio
// player or just the text.
export interface StoryMemory {
  id: string;
  memoryType: 'AUDIO' | 'TEXT';
  title?: string;          // user-edited title; falls back to first line of transcript
  transcript?: string;     // Whisper output (AUDIO) or raw text (TEXT)
  audioUrl?: string;       // only present for AUDIO type
  recordedBy?: string;     // name of contributor
  createdAt: string;
  status: 'PENDING_TRANSCRIPTION' | 'PENDING_REVIEW' | 'APPLIED' | 'UNDONE' | 'FAILED';
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
