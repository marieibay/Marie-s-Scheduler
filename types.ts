
export interface Project {
  id: number;
  title: string;
  dueDate: string; // Stored as YYYY-MM-DD
  notes: string;
  editor: string;
  editorNote: string;
  pzQc: string;
  pzQcNote: string;
  master: string;
  masterNote: string;
  estRt: number;
  totalEdited: number;
  remainingRaw: number;
  isOnHold: boolean;
  status: 'ongoing' | 'done' | 'archived';
}

export type ViewMode = 'manager' | 'editor' | 'client';