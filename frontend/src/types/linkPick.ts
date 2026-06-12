/** Canvas pick mode for choosing a tree member to link to. */
export interface LinkPickState {
  anchorId: string;
  targetId: string | null;
  /** When true, tree clicks select targets instead of opening drawers. */
  picking: boolean;
}
