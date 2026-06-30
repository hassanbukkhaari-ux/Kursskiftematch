export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ComplexityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type NotificationType =
  | 'INQUIRY_RECEIVED'
  | 'PROFESSIONAL_APPLICATION_RECEIVED'
  | 'CASE_CREATED'
  | 'SAFEGUARDING_FLAGGED'
  | 'HOURS_SUBMITTED'
  | 'DOCUMENT_ACTION_REQUIRED'
  | 'CASE_CLOSED'

export type HandoverReason =
  | 'PROFESSIONAL_UNAVAILABLE'
  | 'WORKLOAD_EXCEEDED'
  | 'REQUEST_PROFESSIONAL'
  | 'REQUEST_CASE'
  | 'BETTER_MATCH'
  | 'SAFEGUARDING_CONCERN'
  | 'OTHER'

export interface Profile {
  id: string
  full_name: string | null
  role: 'admin' | 'professional'
  email: string | null
  created_at: string
  updated_at: string
}

// Generated Supabase types are not present in this repository.
// Using `any` prevents PostgREST-JS's SelectQuery utility from collapsing
// named-column selections (e.g. select('id, status')) to `never` when the
// Database generic carries an index-signature Row type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any
