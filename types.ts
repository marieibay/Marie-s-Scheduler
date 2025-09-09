
export interface Project {
  id: number;
  created_at: string;
  title: string;
  due_date: string | null;
  original_due_date: string | null;
  notes: string;
  editor: string;
  editor_note: string;
  pz_qc: string;
  pz_qc_note: string;
  master: string;
  master_note: string;
  est_rt: number;
  total_edited: number;
  remaining_raw: number;
  is_on_hold: boolean;
  is_new_edit: boolean;
  status: 'ongoing' | 'done' | 'archived';
}

export type ViewMode = 'manager' | 'editor' | 'client';

export interface ProductivityLog {
  id?: number;
  editor_name: string;
  project_id: number;
  date: string; // YYYY-MM-DD
  hours_worked: number;
}

export interface QCProductivityLog {
  id?: number;
  qc_name: string;
  project_id: number;
  date: string; // YYYY-MM-DD
  hours_worked: number;
}
