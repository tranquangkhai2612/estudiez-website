/**
 * Static seed data that replaces the former public/data/*.json files.
 *
 * SEED_SUBJECTS / SEED_SEMESTERS / SEED_HELPLINES — read-only reference
 * data that has no backend CRUD endpoint yet.
 */
import type { Helpline, Semester, Subject } from '../types'

// Order MUST match backend seed-data.sql INSERT INTO Subjects order!
export const SEED_SUBJECTS: Subject[] = [
  { id: 'MATH', name: 'Mathematics'        },
  { id: 'LIT',  name: 'Literature'         },
  { id: 'ENG',  name: 'English'            },
  { id: 'PHY',  name: 'Physics'            },
  { id: 'CHEM', name: 'Chemistry'          },
  { id: 'BIO',  name: 'Biology'            },
  { id: 'HIS',  name: 'History'            },
  { id: 'GEO',  name: 'Geography'          },
  { id: 'CS',   name: 'Computer Science'   },
  { id: 'PE',   name: 'Physical Education' },
]

export const SEED_SEMESTERS: Semester[] = [
  {
    id: 'S1-2025',
    name: 'Semester 1',
    year: '2025-2026',
    startDate: '2025-09-05',
    endDate: '2026-01-15',
  },
  {
    id: 'S2-2025',
    name: 'Semester 2',
    year: '2025-2026',
    startDate: '2026-01-20',
    endDate: '2026-05-30',
  },
]

export const SEED_HELPLINES: Helpline[] = [
  { label: 'Academic Counselor', phone: '+1 (800) 400-2101' },
  { label: 'Student Wellness',   phone: '+1 (800) 400-2102' },
  { label: 'Parent Support',     phone: '+1 (800) 400-2103' },
]
