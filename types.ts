
export interface Project {
  id: number;
  title: string;
  dueDate: string; // Stored as YYYY-MM-DD
  notes: string;
  editor: string;
  pzQc: string;
  master: string;
  estRt: number;
  totalEdited: number;
}

export type ViewMode = 'manager' | 'editor' | 'client';