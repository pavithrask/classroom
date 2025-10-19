export interface Classroom {
  id: number;
  name: string;
  grade: string;
  section: string;
  academic_year: string;
  homeroom_teacher?: string | null;
}

export interface Student {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  guardian_name: string;
  guardian_contact: string;
  photo_url?: string | null;
  address?: string | null;
  notes?: string | null;
  active: boolean;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: number;
  class_id: number;
  student_id: number;
  date: string;
  status: AttendanceStatus;
  notes?: string | null;
}

export interface Assignment {
  id: number;
  title: string;
  description?: string | null;
  due_date: string;
  class_id: number;
  max_score: number;
  attachment_url?: string | null;
}

export type SubmissionStatus = 'not_submitted' | 'submitted' | 'submitted_late' | 'exempt';

export interface Submission {
  id: number;
  assignment_id: number;
  student_id: number;
  status: SubmissionStatus;
  score?: number | null;
  feedback?: string | null;
  submitted_at?: string | null;
  file_url?: string | null;
}
