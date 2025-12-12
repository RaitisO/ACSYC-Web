export interface Lesson {
  id: number
  teacher_id: number
  student_id: number
  subject_id: number
  start_time: string
  end_time: string
  is_recurring: boolean
  recurrence_end_date?: string
  status: 'scheduled' | 'completed' | 'cancelled'
  teacher_name: string
  student_name: string
  subject_name: string
}

export interface CalendarDay {
  date: Date
  lessons: Lesson[]
}

export interface TimeSlot {
  time: string
  hour: number
  minute: number
  type: 'lesson' | 'break'
}

export interface DropdownData {
  students: { id: number; first_name: string; last_name: string; email: string }[]
  teachers: { id: number; first_name: string; last_name: string; email: string }[]
  subjects: { id: number; name: string }[]
}

export interface StudentMiroBoard {
  id: number
  student_id: number
  board_name: string
  board_url: string
  created_at: string
}
