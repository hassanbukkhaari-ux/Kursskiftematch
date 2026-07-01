// This file is auto-generated from the Supabase schema.
// Manual additions are appended below the generated block.
// Do NOT remove the manual additions.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          role: 'admin' | 'professional'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          role?: 'admin' | 'professional'
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string
          email?: string
          role?: 'admin' | 'professional'
          updated_at?: string
        }
        Relationships: []
      }
      municipalities: {
        Row: {
          id: string
          name: string
          cvr_number: string | null
          contract_start: string | null
          contract_end: string | null
          sagsbehandler_name: string | null
          sagsbehandler_email: string | null
          sagsbehandler_phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          cvr_number?: string | null
          contract_start?: string | null
          contract_end?: string | null
          sagsbehandler_name?: string | null
          sagsbehandler_email?: string | null
          sagsbehandler_phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          cvr_number?: string | null
          contract_start?: string | null
          contract_end?: string | null
          sagsbehandler_name?: string | null
          sagsbehandler_email?: string | null
          sagsbehandler_phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inbound_inquiries: {
        Row: {
          id: string
          municipality_id: string | null
          municipality_name: string | null
          contact_name: string
          contact_email: string
          contact_phone: string | null
          citizen_age_range: string
          citizen_description: string
          weekly_hours: number
          complexity_level: ComplexityLevel
          status: InquiryStatus
          converted_case_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          municipality_id?: string | null
          municipality_name?: string | null
          contact_name: string
          contact_email: string
          contact_phone?: string | null
          citizen_age_range: string
          citizen_description: string
          weekly_hours: number
          complexity_level?: ComplexityLevel
          status?: InquiryStatus
          converted_case_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          municipality_id?: string | null
          municipality_name?: string | null
          contact_name?: string
          contact_email?: string
          contact_phone?: string | null
          citizen_age_range?: string
          citizen_description?: string
          weekly_hours?: number
          complexity_level?: ComplexityLevel
          status?: InquiryStatus
          converted_case_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      professionals: {
        Row: {
          id: string
          profession: string
          experience_years: number
          availability_hours_per_week: number
          max_cases: number
          geo_radius_km: number
          status: ProfessionalStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          profession: string
          experience_years?: number
          availability_hours_per_week?: number
          max_cases?: number
          geo_radius_km?: number
          status?: ProfessionalStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          profession?: string
          experience_years?: number
          availability_hours_per_week?: number
          max_cases?: number
          geo_radius_km?: number
          status?: ProfessionalStatus
          updated_at?: string
        }
        Relationships: []
      }
      professional_documents: {
        Row: {
          id: string
          professional_id: string
          document_type: DocumentType
          file_name: string
          file_path: string
          file_size: number | null
          mime_type: string | null
          status: DocumentStatus
          rejection_note: string | null
          uploaded_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          expires_at: string | null
        }
        Insert: {
          id?: string
          professional_id: string
          document_type: DocumentType
          file_name: string
          file_path: string
          file_size?: number | null
          mime_type?: string | null
          status?: DocumentStatus
          rejection_note?: string | null
          uploaded_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          expires_at?: string | null
        }
        Update: {
          document_type?: DocumentType
          file_name?: string
          file_path?: string
          file_size?: number | null
          mime_type?: string | null
          status?: DocumentStatus
          rejection_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          expires_at?: string | null
        }
        Relationships: []
      }
      cases: {
        Row: {
          id: string
          municipality_id: string
          citizen_initials: string
          citizen_age_range: string
          citizen_gender: 'MALE' | 'FEMALE' | 'OTHER' | null
          citizen_notes: string | null
          weekly_hours: number
          complexity_level: ComplexityLevel
          status: CaseStatus
          inquiry_id: string | null
          data_retention_expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          municipality_id: string
          citizen_initials: string
          citizen_age_range: string
          citizen_gender?: 'MALE' | 'FEMALE' | 'OTHER' | null
          citizen_notes?: string | null
          weekly_hours: number
          complexity_level?: ComplexityLevel
          status?: CaseStatus
          inquiry_id?: string | null
          data_retention_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          municipality_id?: string
          citizen_initials?: string
          citizen_age_range?: string
          citizen_gender?: 'MALE' | 'FEMALE' | 'OTHER' | null
          citizen_notes?: string | null
          weekly_hours?: number
          complexity_level?: ComplexityLevel
          status?: CaseStatus
          data_retention_expires_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      case_assignments: {
        Row: {
          id: string
          case_id: string
          professional_id: string
          assigned_by: string
          assignment_reason: string | null
          started_at: string
          ended_at: string | null
        }
        Insert: {
          id?: string
          case_id: string
          professional_id: string
          assigned_by: string
          assignment_reason?: string | null
          started_at?: string
          ended_at?: string | null
        }
        Update: {
          assignment_reason?: string | null
          ended_at?: string | null
        }
        Relationships: []
      }
      case_grants: {
        Row: {
          id: string
          case_id: string
          granted_hours: number
          period_start: string
          period_end: string
          status: GrantStatus
          approved_by: string | null
          approved_at: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          case_id: string
          granted_hours: number
          period_start: string
          period_end: string
          status?: GrantStatus
          approved_by?: string | null
          approved_at?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          granted_hours?: number
          period_start?: string
          period_end?: string
          status?: GrantStatus
          approved_by?: string | null
          approved_at?: string | null
        }
        Relationships: []
      }
      case_handovers: {
        Row: {
          id: string
          case_id: string
          outgoing_professional_id: string
          incoming_professional_id: string | null
          reason: HandoverReason
          status: HandoverStatus
          handover_note: string | null
          is_urgent: boolean
          session_logs_transferred: boolean
          transferred_session_logs: string[] | null
          created_by: string
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          case_id: string
          outgoing_professional_id: string
          incoming_professional_id?: string | null
          reason: HandoverReason
          status?: HandoverStatus
          handover_note?: string | null
          is_urgent?: boolean
          session_logs_transferred?: boolean
          transferred_session_logs?: string[] | null
          created_by: string
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          incoming_professional_id?: string | null
          status?: HandoverStatus
          handover_note?: string | null
          is_urgent?: boolean
          session_logs_transferred?: boolean
          transferred_session_logs?: string[] | null
          completed_at?: string | null
        }
        Relationships: []
      }
      session_logs: {
        Row: {
          id: string
          case_id: string
          professional_id: string
          session_date: string
          duration_minutes: number
          status: SessionLogStatus
          observations: string | null
          citizen_mood_tone: string | null
          follow_up_needed: boolean
          follow_up_notes: string | null
          safeguarding_flag: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          case_id: string
          professional_id: string
          session_date: string
          duration_minutes: number
          status?: SessionLogStatus
          observations?: string | null
          citizen_mood_tone?: string | null
          follow_up_needed?: boolean
          follow_up_notes?: string | null
          safeguarding_flag?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          session_date?: string
          duration_minutes?: number
          status?: SessionLogStatus
          observations?: string | null
          citizen_mood_tone?: string | null
          follow_up_needed?: boolean
          follow_up_notes?: string | null
          safeguarding_flag?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      session_log_corrections: {
        Row: {
          id: string
          session_log_id: string
          corrected_by: string
          original_data: Json
          corrected_data: Json
          correction_reason: string
          created_at: string
        }
        Insert: {
          id?: string
          session_log_id: string
          corrected_by: string
          original_data: Json
          corrected_data: Json
          correction_reason: string
          created_at?: string
        }
        Update: never
        Relationships: []
      }
      session_log_transfers: {
        Row: {
          id: string
          session_log_id: string
          from_professional_id: string
          to_professional_id: string
          approved_by: string
          reason: string | null
          transfer_note: string | null
          transferred_at: string
        }
        Insert: {
          id?: string
          session_log_id: string
          from_professional_id: string
          to_professional_id: string
          approved_by: string
          reason?: string | null
          transfer_note?: string | null
          transferred_at?: string
        }
        Update: never
        Relationships: []
      }
      registered_hours: {
        Row: {
          id: string
          professional_id: string
          case_id: string
          week_start: string
          total_hours: number
          status: HoursStatus
          submission_note: string | null
          submitted_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          rejection_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          professional_id: string
          case_id: string
          week_start: string
          total_hours: number
          status?: HoursStatus
          submission_note?: string | null
          submitted_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rejection_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          total_hours?: number
          status?: HoursStatus
          submission_note?: string | null
          submitted_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rejection_note?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contact_logs: {
        Row: {
          id: string
          case_id: string
          professional_id: string
          contact_type: string
          contact_date: string
          summary: string | null
          created_at: string
        }
        Insert: {
          id?: string
          case_id: string
          professional_id: string
          contact_type: string
          contact_date: string
          summary?: string | null
          created_at?: string
        }
        Update: {
          contact_type?: string
          contact_date?: string
          summary?: string | null
        }
        Relationships: []
      }
      contact_disclosures: {
        Row: {
          id: string
          case_id: string
          professional_id: string
          disclosed_at: string
          disclosure_type: string
          disclosure_note: string | null
        }
        Insert: {
          id?: string
          case_id: string
          professional_id: string
          disclosed_at?: string
          disclosure_type: string
          disclosure_note?: string | null
        }
        Update: never
        Relationships: []
      }
      match_runs: {
        Row: {
          id: string
          case_id: string
          triggered_by: string
          status: MatchRunStatus
          algorithm_version: string
          parameters: Json | null
          created_at: string
          scored_at: string | null
          assigned_at: string | null
        }
        Insert: {
          id?: string
          case_id: string
          triggered_by: string
          status?: MatchRunStatus
          algorithm_version?: string
          parameters?: Json | null
          created_at?: string
          scored_at?: string | null
          assigned_at?: string | null
        }
        Update: {
          status?: MatchRunStatus
          algorithm_version?: string
          parameters?: Json | null
          scored_at?: string | null
          assigned_at?: string | null
        }
        Relationships: []
      }
      match_candidates: {
        Row: {
          id: string
          run_id: string
          professional_id: string
          score: number
          score_breakdown: Json | null
          rank: number | null
          is_selected: boolean
          override_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          run_id: string
          professional_id: string
          score: number
          score_breakdown?: Json | null
          rank?: number | null
          is_selected?: boolean
          override_reason?: string | null
          created_at?: string
        }
        Update: {
          score?: number
          score_breakdown?: Json | null
          rank?: number | null
          is_selected?: boolean
          override_reason?: string | null
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          id: string
          event_type: string
          actor_id: string | null
          resource_type: string
          resource_id: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          actor_id?: string | null
          resource_type: string
          resource_id: string
          metadata?: Json | null
          created_at?: string
        }
        Update: never
        Relationships: []
      }
      notification_log: {
        Row: {
          id: string
          notification_type: NotificationType
          related_entity_type: string
          related_entity_id: string
          recipient_profile_id: string | null
          recipient_email: string | null
          delivery_channel: string
          status: 'PENDING' | 'SENT' | 'FAILED'
          attempt_count: number
          failure_reason: string | null
          subject: string | null
          body_text: string | null
          created_at: string
          sent_at: string | null
          failed_at: string | null
        }
        Insert: {
          id?: string
          notification_type: NotificationType
          related_entity_type: string
          related_entity_id: string
          recipient_profile_id?: string | null
          recipient_email?: string | null
          delivery_channel?: string
          status?: 'PENDING' | 'SENT' | 'FAILED'
          attempt_count?: number
          failure_reason?: string | null
          subject?: string | null
          body_text?: string | null
          created_at?: string
          sent_at?: string | null
          failed_at?: string | null
        }
        Update: {
          status?: 'PENDING' | 'SENT' | 'FAILED'
          attempt_count?: number
          failure_reason?: string | null
          subject?: string | null
          body_text?: string | null
          sent_at?: string | null
          failed_at?: string | null
        }
        Relationships: []
      }
      deletion_schedules: {
        Row: {
          id: string
          record_type: string
          record_id: string
          scheduled_for_deletion_at: string
          retention_expired_at: string
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          record_type: string
          record_id: string
          scheduled_for_deletion_at: string
          retention_expired_at: string
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          scheduled_for_deletion_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      problem_areas: {
        Row: { id: string; code: string; label_da: string; sort_order: number }
        Insert: { id?: string; code: string; label_da: string; sort_order?: number }
        Update: { label_da?: string; sort_order?: number }
        Relationships: []
      }
      goals_lookup: {
        Row: { id: string; code: string; label_da: string; sort_order: number }
        Insert: { id?: string; code: string; label_da: string; sort_order?: number }
        Update: { label_da?: string; sort_order?: number }
        Relationships: []
      }
      special_wishes_lookup: {
        Row: { id: string; code: string; label_da: string; sort_order: number }
        Insert: { id?: string; code: string; label_da: string; sort_order?: number }
        Update: { label_da?: string; sort_order?: number }
        Relationships: []
      }
      case_problem_areas: {
        Row: { id: string; case_id: string; problem_area_id: string; created_at: string }
        Insert: { id?: string; case_id: string; problem_area_id: string; created_at?: string }
        Update: never
        Relationships: []
      }
      case_goals: {
        Row: { id: string; case_id: string; goal_id: string; created_at: string }
        Insert: { id?: string; case_id: string; goal_id: string; created_at?: string }
        Update: never
        Relationships: []
      }
      case_special_wishes: {
        Row: { id: string; case_id: string; special_wish_id: string; created_at: string }
        Insert: { id?: string; case_id: string; special_wish_id: string; created_at?: string }
        Update: never
        Relationships: []
      }
      case_complexity_factors: {
        Row: { id: string; case_id: string; factor: string; created_at: string }
        Insert: { id?: string; case_id: string; factor: string; created_at?: string }
        Update: never
        Relationships: []
      }
      profession_types: {
        Row: { id: string; code: string; label_da: string; sort_order: number }
        Insert: { id?: string; code: string; label_da: string; sort_order?: number }
        Update: { label_da?: string; sort_order?: number }
        Relationships: []
      }
      competency_types: {
        Row: { id: string; code: string; label_da: string; sort_order: number }
        Insert: { id?: string; code: string; label_da: string; sort_order?: number }
        Update: { label_da?: string; sort_order?: number }
        Relationships: []
      }
      method_types: {
        Row: { id: string; code: string; label_da: string; sort_order: number }
        Insert: { id?: string; code: string; label_da: string; sort_order?: number }
        Update: { label_da?: string; sort_order?: number }
        Relationships: []
      }
      target_group_types: {
        Row: { id: string; code: string; label_da: string; sort_order: number }
        Insert: { id?: string; code: string; label_da: string; sort_order?: number }
        Update: { label_da?: string; sort_order?: number }
        Relationships: []
      }
      work_task_types: {
        Row: { id: string; code: string; label_da: string; sort_order: number }
        Insert: { id?: string; code: string; label_da: string; sort_order?: number }
        Update: { label_da?: string; sort_order?: number }
        Relationships: []
      }
      language_types: {
        Row: { id: string; code: string; label_da: string; sort_order: number }
        Insert: { id?: string; code: string; label_da: string; sort_order?: number }
        Update: { label_da?: string; sort_order?: number }
        Relationships: []
      }
      certificate_types: {
        Row: { id: string; code: string; label_da: string; sort_order: number }
        Insert: { id?: string; code: string; label_da: string; sort_order?: number }
        Update: { label_da?: string; sort_order?: number }
        Relationships: []
      }
      professional_competencies: {
        Row: { id: string; professional_id: string; competency_type_id: string; created_at: string }
        Insert: { id?: string; professional_id: string; competency_type_id: string; created_at?: string }
        Update: never
        Relationships: []
      }
      professional_methods: {
        Row: { id: string; professional_id: string; method_type_id: string; created_at: string }
        Insert: { id?: string; professional_id: string; method_type_id: string; created_at?: string }
        Update: never
        Relationships: []
      }
      professional_target_groups: {
        Row: { id: string; professional_id: string; target_group_type_id: string; created_at: string }
        Insert: { id?: string; professional_id: string; target_group_type_id: string; created_at?: string }
        Update: never
        Relationships: []
      }
      professional_work_tasks: {
        Row: { id: string; professional_id: string; work_task_type_id: string; created_at: string }
        Insert: { id?: string; professional_id: string; work_task_type_id: string; created_at?: string }
        Update: never
        Relationships: []
      }
      professional_languages: {
        Row: { id: string; professional_id: string; language_type_id: string; created_at: string }
        Insert: { id?: string; professional_id: string; language_type_id: string; created_at?: string }
        Update: never
        Relationships: []
      }
      professional_certificates: {
        Row: {
          id: string
          professional_id: string
          certificate_type_id: string | null
          custom_name: string | null
          issued_at: string | null
          expires_at: string | null
          status: 'VALID' | 'EXPIRED' | 'PENDING_REVIEW'
          created_at: string
        }
        Insert: {
          id?: string
          professional_id: string
          certificate_type_id?: string | null
          custom_name?: string | null
          issued_at?: string | null
          expires_at?: string | null
          status?: 'VALID' | 'EXPIRED' | 'PENDING_REVIEW'
          created_at?: string
        }
        Update: {
          certificate_type_id?: string | null
          custom_name?: string | null
          issued_at?: string | null
          expires_at?: string | null
          status?: 'VALID' | 'EXPIRED' | 'PENDING_REVIEW'
        }
        Relationships: []
      }
      professional_consents: {
        Row: {
          id: string
          professional_id: string
          consent_type: string
          consented: boolean
          consented_at: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          professional_id: string
          consent_type: string
          consented: boolean
          consented_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: never
        Relationships: []
      }
      professional_geography: {
        Row: {
          id: string
          professional_id: string
          municipality_id: string
          created_at: string
        }
        Insert: {
          id?: string
          professional_id: string
          municipality_id: string
          created_at?: string
        }
        Update: never
        Relationships: []
      }
    }
    Views: {
      v_cases_with_professional: {
        Row: {
          id: string
          municipality_id: string
          citizen_initials: string
          citizen_age_range: string
          complexity_level: ComplexityLevel
          weekly_hours: number
          status: CaseStatus
          active_grant_hours: number | null
          approved_hours_used: number
          professional_id: string | null
          professional_name: string | null
          created_at: string
          updated_at: string
        }
      }
      v_case_tags: {
        Row: {
          case_id: string
          problem_area_codes: string[] | null
          goal_codes: string[] | null
          special_wish_codes: string[] | null
        }
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// ================================================================
// Enum types
// ================================================================

export type ComplexityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type CaseStatus = 'OPEN' | 'MATCHED' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
export type InquiryStatus = 'PENDING' | 'IN_REVIEW' | 'CONVERTED' | 'REJECTED' | 'SPAM'
export type ProfessionalStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
export type DocumentType = 'CPR' | 'CRIMINAL_RECORD' | 'DIPLOMA' | 'CV' | 'OTHER'
export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
export type SessionLogStatus = 'DRAFT' | 'FINAL'
export type HoursStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'
export type GrantStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
export type HandoverReason =
  | 'PROFESSIONAL_UNAVAILABLE'
  | 'WORKLOAD_EXCEEDED'
  | 'REQUEST_PROFESSIONAL'
  | 'REQUEST_CASE'
  | 'BETTER_MATCH'
  | 'SAFEGUARDING_CONCERN'
  | 'OTHER'
export type HandoverStatus = 'INITIATED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type MatchRunStatus = 'INITIATED' | 'SCORED' | 'ASSIGNED' | 'OVERRIDDEN' | 'CANCELLED'

export type NotificationType =
  | 'INQUIRY_RECEIVED'
  | 'PROFESSIONAL_APPLICATION_RECEIVED'
  | 'CASE_CREATED'
  | 'SAFEGUARDING_FLAGGED'
  | 'HOURS_SUBMITTED'
  | 'DOCUMENT_ACTION_REQUIRED'
  | 'CASE_CLOSED'
  | 'HANDOVER_INITIATED'

// ================================================================
// Convenience row types
// ================================================================

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Municipality = Database['public']['Tables']['municipalities']['Row']
export type InboundInquiry = Database['public']['Tables']['inbound_inquiries']['Row']
export type Professional = Database['public']['Tables']['professionals']['Row']
export type ProfessionalDocument = Database['public']['Tables']['professional_documents']['Row']
export type Case = Database['public']['Tables']['cases']['Row']
export type ProblemArea = Database['public']['Tables']['problem_areas']['Row']
export type GoalLookup = Database['public']['Tables']['goals_lookup']['Row']
export type SpecialWishLookup = Database['public']['Tables']['special_wishes_lookup']['Row']
export type CaseProblemArea = Database['public']['Tables']['case_problem_areas']['Row']
export type CaseGoal = Database['public']['Tables']['case_goals']['Row']
export type CaseSpecialWish = Database['public']['Tables']['case_special_wishes']['Row']
export type CaseComplexityFactors = Database['public']['Tables']['case_complexity_factors']['Row']
export type CaseAssignment = Database['public']['Tables']['case_assignments']['Row']
export type CaseGrant = Database['public']['Tables']['case_grants']['Row']
export type CaseHandover = Database['public']['Tables']['case_handovers']['Row']
export type SessionLog = Database['public']['Tables']['session_logs']['Row']
export type SessionLogCorrection = Database['public']['Tables']['session_log_corrections']['Row']
export type SessionLogTransfer = Database['public']['Tables']['session_log_transfers']['Row']
export type RegisteredHours = Database['public']['Tables']['registered_hours']['Row']
export type ContactLog = Database['public']['Tables']['contact_logs']['Row']
export type ContactDisclosure = Database['public']['Tables']['contact_disclosures']['Row']
export type MatchRun = Database['public']['Tables']['match_runs']['Row']
export type MatchCandidate = Database['public']['Tables']['match_candidates']['Row']
export type AuditEvent = Database['public']['Tables']['audit_events']['Row']
export type NotificationLog = Database['public']['Tables']['notification_log']['Row']
export type DeletionSchedule = Database['public']['Tables']['deletion_schedules']['Row']
