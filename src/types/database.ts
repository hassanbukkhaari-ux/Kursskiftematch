export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'professional'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'professional'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'professional'
          updated_at?: string
        }
        Relationships: []
      }
      municipalities: {
        Row: {
          id: string
          name: string
          status: 'ACTIVE' | 'INACTIVE'
          sagsbehandler_name: string | null
          sagsbehandler_email: string | null
          sagsbehandler_phone: string | null
          secondary_contact_name: string | null
          secondary_contact_email: string | null
          secondary_contact_phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          status?: 'ACTIVE' | 'INACTIVE'
          sagsbehandler_name?: string | null
          sagsbehandler_email?: string | null
          sagsbehandler_phone?: string | null
          secondary_contact_name?: string | null
          secondary_contact_email?: string | null
          secondary_contact_phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          status?: 'ACTIVE' | 'INACTIVE'
          sagsbehandler_name?: string | null
          sagsbehandler_email?: string | null
          sagsbehandler_phone?: string | null
          secondary_contact_name?: string | null
          secondary_contact_email?: string | null
          secondary_contact_phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inbound_inquiries: {
        Row: {
          id: string
          submission_type: 'MUNICIPALITY_INQUIRY' | 'PROFESSIONAL_APPLICATION' | 'PARTNER_LEAD'
          status: 'PENDING' | 'REVIEWED' | 'CONVERTED' | 'REJECTED' | 'SPAM'
          submitted_at: string
          submitter_name: string
          submitter_email: string
          submitter_phone: string | null
          organization_name: string | null
          message: string | null
          form_data: Json
          source_url: string | null
          ip_hash: string | null
          captcha_verified: boolean
          reviewed_by: string | null
          reviewed_at: string | null
          rejection_reason: string | null
          converted_to_type: string | null
          converted_to_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          submission_type: 'MUNICIPALITY_INQUIRY' | 'PROFESSIONAL_APPLICATION' | 'PARTNER_LEAD'
          status?: 'PENDING' | 'REVIEWED' | 'CONVERTED' | 'REJECTED' | 'SPAM'
          submitted_at?: string
          submitter_name: string
          submitter_email: string
          submitter_phone?: string | null
          organization_name?: string | null
          message?: string | null
          form_data?: Json
          source_url?: string | null
          ip_hash?: string | null
          captcha_verified?: boolean
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          converted_to_type?: string | null
          converted_to_id?: string | null
          created_at?: string
        }
        Update: {
          status?: 'PENDING' | 'REVIEWED' | 'CONVERTED' | 'REJECTED' | 'SPAM'
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          converted_to_type?: string | null
          converted_to_id?: string | null
        }
        Relationships: []
      }
      professionals: {
        Row: {
          id: string
          profession: ProfessionType
          experience_years: number
          target_age_groups: string[]
          max_complexity_level: ComplexityLevel
          qualifications: string[]
          capacity_hours_week: number
          max_concurrent_cases: number
          availability_days: string[]
          availability_status: AvailabilityStatus
          status: ProfessionalStatus
          gender: Gender | null
          education: string | null
          certificates: string[]
          daily_occupation: string | null
          experience_with_genders: ExperienceWithGender[]
          geography: string[]
          created_at: string
          updated_at: string
          archived_at: string | null
        }
        Insert: {
          id: string
          profession: ProfessionType
          experience_years?: number
          target_age_groups?: string[]
          max_complexity_level?: ComplexityLevel
          qualifications?: string[]
          capacity_hours_week?: number
          max_concurrent_cases?: number
          availability_days?: string[]
          availability_status?: AvailabilityStatus
          status?: ProfessionalStatus
          gender?: Gender | null
          education?: string | null
          certificates?: string[]
          daily_occupation?: string | null
          experience_with_genders?: ExperienceWithGender[]
          geography?: string[]
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
        Update: {
          profession?: ProfessionType
          experience_years?: number
          target_age_groups?: string[]
          max_complexity_level?: ComplexityLevel
          qualifications?: string[]
          capacity_hours_week?: number
          max_concurrent_cases?: number
          availability_days?: string[]
          availability_status?: AvailabilityStatus
          status?: ProfessionalStatus
          gender?: Gender | null
          education?: string | null
          certificates?: string[]
          daily_occupation?: string | null
          experience_with_genders?: ExperienceWithGender[]
          geography?: string[]
          updated_at?: string
          archived_at?: string | null
        }
        Relationships: []
      }
      professional_documents: {
        Row: {
          id: string
          professional_id: string
          document_type: DocumentType
          status: DocumentStatus
          file_path: string | null
          file_hash: string | null
          uploaded_at: string | null
          uploaded_by: string | null
          expiry_date: string | null
          verified_at: string | null
          verified_by: string | null
          verification_notes: string | null
          re_upload_required: boolean
          created_at: string
          archived_at: string | null
        }
        Insert: {
          id?: string
          professional_id: string
          document_type: DocumentType
          status?: DocumentStatus
          file_path?: string | null
          file_hash?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          expiry_date?: string | null
          verified_at?: string | null
          verified_by?: string | null
          verification_notes?: string | null
          re_upload_required?: boolean
          created_at?: string
          archived_at?: string | null
        }
        Update: {
          status?: DocumentStatus
          file_path?: string | null
          file_hash?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          expiry_date?: string | null
          verified_at?: string | null
          verified_by?: string | null
          verification_notes?: string | null
          re_upload_required?: boolean
          archived_at?: string | null
        }
        Relationships: []
      }
      cases: {
        Row: {
          id: string
          municipality_id: string
          status: CaseStatus
          citizen_initials: string
          citizen_age_range: AgeRange
          citizen_gender: Gender | null
          citizen_notes: string | null
          weekly_hours: number
          complexity_level: ComplexityLevel
          intake_token: string | null
          intake_contact_name: string | null
          intake_contact_email: string | null
          created_at: string
          updated_at: string
          archived_at: string | null
          data_retention_expires_at: string | null
        }
        Insert: {
          id?: string
          municipality_id: string
          status?: CaseStatus
          citizen_initials: string
          citizen_age_range: AgeRange
          citizen_gender?: Gender | null
          citizen_notes?: string | null
          weekly_hours?: number
          complexity_level?: ComplexityLevel
          intake_token?: string | null
          intake_contact_name?: string | null
          intake_contact_email?: string | null
          created_at?: string
          updated_at?: string
          archived_at?: string | null
          data_retention_expires_at?: string | null
        }
        Update: {
          municipality_id?: string
          status?: CaseStatus
          citizen_initials?: string
          citizen_age_range?: AgeRange
          citizen_gender?: Gender | null
          citizen_notes?: string | null
          weekly_hours?: number
          complexity_level?: ComplexityLevel
          intake_token?: string | null
          intake_contact_name?: string | null
          intake_contact_email?: string | null
          updated_at?: string
          archived_at?: string | null
          data_retention_expires_at?: string | null
        }
        Relationships: []
      }
      case_proposals: {
        Row: {
          id: string
          case_id: string
          professional_id: string
          proposal_note: string | null
          estimated_hours_week: number | null
          status: ProposalStatus
          response_token: string
          created_by: string
          sent_at: string | null
          responded_at: string | null
          municipality_response_note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          case_id: string
          professional_id: string
          proposal_note?: string | null
          estimated_hours_week?: number | null
          status?: ProposalStatus
          response_token?: string
          created_by: string
          sent_at?: string | null
          responded_at?: string | null
          municipality_response_note?: string | null
          created_at?: string
        }
        Update: {
          proposal_note?: string | null
          estimated_hours_week?: number | null
          status?: ProposalStatus
          sent_at?: string | null
          responded_at?: string | null
          municipality_response_note?: string | null
        }
        Relationships: []
      }
      problem_areas: {
        Row: {
          id: string
          code: string
          label_da: string
          sort_order: number
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          label_da: string
          sort_order?: number
          active?: boolean
          created_at?: string
        }
        Update: {
          code?: string
          label_da?: string
          sort_order?: number
          active?: boolean
        }
        Relationships: []
      }
      goals_lookup: {
        Row: {
          id: string
          code: string
          label_da: string
          sort_order: number
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          label_da: string
          sort_order?: number
          active?: boolean
          created_at?: string
        }
        Update: {
          code?: string
          label_da?: string
          sort_order?: number
          active?: boolean
        }
        Relationships: []
      }
      special_wishes_lookup: {
        Row: {
          id: string
          code: string
          label_da: string
          sort_order: number
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          label_da: string
          sort_order?: number
          active?: boolean
          created_at?: string
        }
        Update: {
          code?: string
          label_da?: string
          sort_order?: number
          active?: boolean
        }
        Relationships: []
      }
      case_problem_areas: {
        Row: {
          case_id: string
          problem_area_id: string
          created_at: string
        }
        Insert: {
          case_id: string
          problem_area_id: string
          created_at?: string
        }
        Update: {
          case_id?: string
          problem_area_id?: string
        }
        Relationships: []
      }
      case_goals: {
        Row: {
          case_id: string
          goal_id: string
          created_at: string
        }
        Insert: {
          case_id: string
          goal_id: string
          created_at?: string
        }
        Update: {
          case_id?: string
          goal_id?: string
        }
        Relationships: []
      }
      case_special_wishes: {
        Row: {
          case_id: string
          special_wish_id: string
          created_at: string
        }
        Insert: {
          case_id: string
          special_wish_id: string
          created_at?: string
        }
        Update: {
          case_id?: string
          special_wish_id?: string
        }
        Relationships: []
      }
      case_complexity_factors: {
        Row: {
          id: string
          case_id: string
          mental_health: boolean
          family_instability: boolean
          school: boolean
          violence: boolean
          substance_use: boolean
          criminality: boolean
          multiple_agencies: boolean
          diagnosis: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          case_id: string
          mental_health?: boolean
          family_instability?: boolean
          school?: boolean
          violence?: boolean
          substance_use?: boolean
          criminality?: boolean
          multiple_agencies?: boolean
          diagnosis?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          mental_health?: boolean
          family_instability?: boolean
          school?: boolean
          violence?: boolean
          substance_use?: boolean
          criminality?: boolean
          multiple_agencies?: boolean
          diagnosis?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      case_assignments: {
        Row: {
          id: string
          case_id: string
          professional_id: string
          assignment_status: AssignmentStatus
          started_at: string
          ended_at: string | null
          assigned_by: string
          assignment_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          case_id: string
          professional_id: string
          assignment_status?: AssignmentStatus
          started_at?: string
          ended_at?: string | null
          assigned_by: string
          assignment_reason?: string | null
          created_at?: string
        }
        Update: {
          assignment_status?: AssignmentStatus
          ended_at?: string | null
        }
        Relationships: []
      }
      case_grants: {
        Row: {
          id: string
          case_id: string
          municipality_id: string
          granted_hours: number
          period_start: string
          period_end: string
          status: GrantStatus
          created_by: string
          created_at: string
          activated_at: string | null
          archived_at: string | null
        }
        Insert: {
          id?: string
          case_id: string
          municipality_id: string
          granted_hours: number
          period_start: string
          period_end: string
          status?: GrantStatus
          created_by: string
          created_at?: string
          activated_at?: string | null
          archived_at?: string | null
        }
        Update: {
          granted_hours?: number
          period_start?: string
          period_end?: string
          status?: GrantStatus
          activated_at?: string | null
          archived_at?: string | null
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
          follow_up_reason: string | null
          safeguarding_concern_flag: boolean
          safeguarding_detail: string | null
          safeguarding_acknowledged_at: string | null
          safeguarding_acknowledged_by: string | null
          participant_names: string[] | null
          location: string | null
          created_by: string
          created_at: string
          data_retention_expires_at: string | null
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
          follow_up_reason?: string | null
          safeguarding_concern_flag?: boolean
          safeguarding_detail?: string | null
          safeguarding_acknowledged_at?: string | null
          safeguarding_acknowledged_by?: string | null
          participant_names?: string[] | null
          location?: string | null
          created_by: string
          created_at?: string
          data_retention_expires_at?: string | null
        }
        Update: {
          session_date?: string
          duration_minutes?: number
          status?: SessionLogStatus
          observations?: string | null
          citizen_mood_tone?: string | null
          follow_up_needed?: boolean
          follow_up_reason?: string | null
          safeguarding_concern_flag?: boolean
          safeguarding_detail?: string | null
          safeguarding_acknowledged_at?: string | null
          safeguarding_acknowledged_by?: string | null
          participant_names?: string[] | null
          location?: string | null
          data_retention_expires_at?: string | null
        }
        Relationships: []
      }
      session_log_corrections: {
        Row: {
          id: string
          session_log_id: string
          correction_note: string
          correction_reason: CorrectionReason
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          session_log_id: string
          correction_note: string
          correction_reason: CorrectionReason
          created_by: string
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
          reason: string
          transfer_note: string | null
          created_at: string
          visibility_granted_at: string
        }
        Insert: {
          id?: string
          session_log_id: string
          from_professional_id: string
          to_professional_id: string
          approved_by: string
          reason: string
          transfer_note?: string | null
          created_at?: string
          visibility_granted_at?: string
        }
        Update: never
        Relationships: []
      }
      registered_hours: {
        Row: {
          id: string
          case_id: string
          professional_id: string
          work_date: string
          work_type: WorkType
          hours: number
          session_log_id: string | null
          status: HoursStatus
          submitted_at: string | null
          grant_period_id: string | null
          description: string | null
          outside_grant_reason: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          review_note: string | null
          created_by: string
          created_at: string
          updated_by: string | null
          updated_at: string
          archived_at: string | null
        }
        Insert: {
          id?: string
          case_id: string
          professional_id: string
          work_date: string
          work_type: WorkType
          hours: number
          session_log_id?: string | null
          status?: HoursStatus
          submitted_at?: string | null
          grant_period_id?: string | null
          description?: string | null
          outside_grant_reason?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_note?: string | null
          created_by: string
          created_at?: string
          updated_by?: string | null
          updated_at?: string
          archived_at?: string | null
        }
        Update: {
          work_date?: string
          work_type?: WorkType
          hours?: number
          session_log_id?: string | null
          status?: HoursStatus
          submitted_at?: string | null
          grant_period_id?: string | null
          description?: string | null
          outside_grant_reason?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_note?: string | null
          updated_by?: string | null
          updated_at?: string
          archived_at?: string | null
        }
        Relationships: []
      }
      contact_logs: {
        Row: {
          id: string
          case_id: string
          professional_id: string
          contact_type: ContactType
          logged_at: string
          logged_by: string
          note: string | null
          outcome: string | null
          follow_up_required: boolean
          created_at: string
        }
        Insert: {
          id?: string
          case_id: string
          professional_id: string
          contact_type: ContactType
          logged_at: string
          logged_by: string
          note?: string | null
          outcome?: string | null
          follow_up_required?: boolean
          created_at?: string
        }
        Update: never
        Relationships: []
      }
      contact_disclosures: {
        Row: {
          id: string
          case_id: string
          disclosed_to_professional_id: string
          disclosed_by: string
          disclosed_at: string
          contact_method: 'EMAIL' | 'PHONE' | 'MEETING'
          sagsbehandler_name: string | null
          sagsbehandler_email: string | null
          sagsbehandler_phone: string | null
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          case_id: string
          disclosed_to_professional_id: string
          disclosed_by: string
          disclosed_at?: string
          contact_method: 'EMAIL' | 'PHONE' | 'MEETING'
          sagsbehandler_name?: string | null
          sagsbehandler_email?: string | null
          sagsbehandler_phone?: string | null
          reason?: string | null
          created_at?: string
        }
        Update: never
        Relationships: []
      }
      match_runs: {
        Row: {
          id: string
          case_id: string
          triggered_by: string | null
          triggered_at: string
          status: MatchRunStatus
          algorithm_version: string
          final_assignment_id: string | null
          assigned_at: string | null
          selected_by: string | null
          selected_at: string | null
          selected_reason: string | null
          matching_criteria: Json | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          case_id: string
          triggered_by: string | null
          triggered_at?: string
          status?: MatchRunStatus
          algorithm_version?: string
          final_assignment_id?: string | null
          assigned_at?: string | null
          selected_by?: string | null
          selected_at?: string | null
          selected_reason?: string | null
          matching_criteria?: Json | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          status?: MatchRunStatus
          final_assignment_id?: string | null
          assigned_at?: string | null
          selected_by?: string | null
          selected_at?: string | null
          selected_reason?: string | null
          notes?: string | null
        }
        Relationships: []
      }
      match_candidates: {
        Row: {
          id: string
          match_run_id: string
          professional_id: string
          rank: number
          overall_score: number
          qualifications_score: number
          availability_score: number
          capacity_score: number
          complexity_fit_score: number
          algorithm_version: string
          scoring_explanation: string
          created_at: string
        }
        Insert: {
          id?: string
          match_run_id: string
          professional_id: string
          rank: number
          overall_score: number
          qualifications_score: number
          availability_score: number
          capacity_score: number
          complexity_fit_score: number
          algorithm_version?: string
          scoring_explanation: string
          created_at?: string
        }
        Update: never
        Relationships: []
      }
      audit_events: {
        Row: {
          id: string
          event_type: string
          actor_id: string | null
          resource_type: string
          resource_id: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          actor_id?: string | null
          resource_type: string
          resource_id: string
          metadata?: Json
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
          reason: 'RETENTION_EXPIRED' | 'USER_REQUEST' | 'LEGAL_REQUIREMENT'
          created_at: string
          executed_at: string | null
        }
        Insert: {
          id?: string
          record_type: string
          record_id: string
          scheduled_for_deletion_at: string
          retention_expired_at: string
          reason: 'RETENTION_EXPIRED' | 'USER_REQUEST' | 'LEGAL_REQUIREMENT'
          created_at?: string
          executed_at?: string | null
        }
        Update: {
          scheduled_for_deletion_at?: string
          executed_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_cases_with_professional: {
        Row: {
          id: string
          municipality_id: string
          status: CaseStatus
          citizen_initials: string
          citizen_age_range: AgeRange
          complexity_level: ComplexityLevel
          weekly_hours: number
          professional_id: string | null
          assignment_id: string | null
          assignment_started_at: string | null
          active_grant_hours: number | null
          approved_hours_used: number
        }
        Relationships: []
      }
      v_professionals_available: {
        Row: {
          id: string
          profession: ProfessionType
          experience_years: number
          max_complexity_level: ComplexityLevel
          target_age_groups: string[]
          qualifications: string[]
          capacity_hours_week: number
          max_concurrent_cases: number
          availability_status: AvailabilityStatus
          availability_days: string[]
          current_assignments: number
          current_hours_assigned: number
        }
        Relationships: []
      }
      v_grant_usage: {
        Row: {
          id: string
          case_id: string
          granted_hours: number
          approved_hours: number
          remaining_hours: number
          over_grant: boolean
        }
        Relationships: []
      }
      v_case_tags: {
        Row: {
          case_id: string
          problem_area_codes: string[]
          goal_codes: string[]
          special_wish_codes: string[]
        }
        Relationships: []
      }
    }
    Functions: {}
    Enums: {}
  }
}

// ================================================================
// Enum types
// ================================================================

export type Gender = 'MALE' | 'FEMALE' | 'OTHER'

export type ExperienceWithGender = 'BOYS' | 'GIRLS'

export type ProfessionType =
  | 'TEACHER'
  | 'PEDAGOGUE'
  | 'NURSE'
  | 'PSYCHOLOGIST'
  | 'SOCIAL_WORKER'
  | 'COUNSELOR'
  | 'OTHER'

export type ComplexityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type ProfessionalStatus = 'REGISTERED' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'

export type AvailabilityStatus = 'AVAILABLE' | 'PARTIALLY_AVAILABLE' | 'UNAVAILABLE'

export type DocumentType =
  | 'CV'
  | 'CRIMINAL_RECORD'
  | 'CHILD_PROTECTION'
  | 'DRIVING_LICENSE'
  | 'QUALIFICATION'
  | 'INSURANCE'
  | 'OTHER'

export type DocumentStatus = 'PENDING_UPLOAD' | 'UNVERIFIED' | 'VERIFIED' | 'ARCHIVED'

export type CaseStatus = 'OPEN' | 'MATCHED' | 'PROPOSED' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'

export type ProposalStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'DECLINED'

export type AgeRange = '0-5' | '6-12' | '13-18' | '18+'

export type AssignmentStatus = 'ACTIVE' | 'TRANSITIONED' | 'TERMINATED' | 'ARCHIVED'

export type GrantStatus = 'PENDING' | 'ACTIVE' | 'ARCHIVED' | 'REVOKED'

export type HandoverReason =
  | 'PROFESSIONAL_UNAVAILABLE'
  | 'WORKLOAD_EXCEEDED'
  | 'REQUEST_PROFESSIONAL'
  | 'REQUEST_CASE'
  | 'BETTER_MATCH'
  | 'SAFEGUARDING_CONCERN'
  | 'OTHER'

export type HandoverStatus = 'INITIATED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export type SessionLogStatus = 'DRAFT' | 'FINAL' | 'CORRECTED' | 'ARCHIVED'

export type CorrectionReason = 'TYPO' | 'WRONG_TIME' | 'CLARIFICATION' | 'OMISSION' | 'SAFEGUARDING' | 'OTHER'

export type WorkType =
  | 'DIRECT_SESSION'
  | 'TRANSPORT'
  | 'DOCUMENTATION'
  | 'COORDINATION'
  | 'CRISIS_RESPONSE'
  | 'TRAINING'
  | 'OTHER'

export type HoursStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'OUTSIDE_GRANT'

export type ContactType = 'PHONE_CALL' | 'EMAIL' | 'IN_PERSON' | 'OTHER'

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
  | 'PROPOSAL_SENT'
  | 'PROPOSAL_ACCEPTED'
  | 'PROPOSAL_DECLINED'

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
export type CaseProposal = Database['public']['Tables']['case_proposals']['Row']
