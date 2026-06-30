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

type DbRow = Record<string, unknown>

export type Database = {
  public: {
    Tables: {
      [tableName: string]: {
        Row: DbRow
        Insert: DbRow
        Update: Partial<DbRow>
        Relationships: unknown[]
      }
    }
    Views: {
      [viewName: string]: {
        Row: DbRow
        Relationships: unknown[]
      }
    }
    Functions: {
      [fnName: string]: {
        Args: DbRow
        Returns: unknown
      }
    }
    Enums: {
      [enumName: string]: string
    }
    CompositeTypes: {
      [typeName: string]: DbRow
    }
  }
}
