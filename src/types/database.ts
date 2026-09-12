export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// Shape shared by the profile taxonomy lookup tables (profession_types,
// competency_types, method_types, target_group_types, work_task_types,
// language_types, certificate_types).
type LookupTable = {
  Row: { id: string; name: string; is_active: boolean; sort_order: number }
  Insert: { id?: string; name: string; is_active?: boolean; sort_order?: number }
  Update: { name?: string; is_active?: boolean; sort_order?: number }
  Relationships: []
}

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
          available_from_date: string | null
          availability_note: string | null
          status: ProfessionalStatus
          gender: Gender | null
          education: string | null
          certificates: string[]
          daily_occupation: string | null
          experience_with_genders: ExperienceWithGender[]
          geography: string[]
          job_title: string | null
          phone: string | null
          address: string | null
          postal_code: string | null
          city: string | null
          region: string | null
          profile_image_url: string | null
          profession_type_id: string | null
          specialization: string | null
          authorization_note: string | null
          bio: string | null
          max_hours_per_week: number | null
          available_now: boolean
          can_take_acute: boolean
          can_work_evening: boolean
          can_work_weekend: boolean
          can_work_night: boolean
          has_drivers_license: boolean
          has_own_car: boolean
          can_transport_citizen: boolean
          max_driving_radius_km: number | null
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
          available_from_date?: string | null
          availability_note?: string | null
          status?: ProfessionalStatus
          gender?: Gender | null
          education?: string | null
          certificates?: string[]
          daily_occupation?: string | null
          experience_with_genders?: ExperienceWithGender[]
          geography?: string[]
          job_title?: string | null
          phone?: string | null
          address?: string | null
          postal_code?: string | null
          city?: string | null
          region?: string | null
          profile_image_url?: string | null
          profession_type_id?: string | null
          specialization?: string | null
          authorization_note?: string | null
          bio?: string | null
          max_hours_per_week?: number | null
          available_now?: boolean
          can_take_acute?: boolean
          can_work_evening?: boolean
          can_work_weekend?: boolean
          can_work_night?: boolean
          has_drivers_license?: boolean
          has_own_car?: boolean
          can_transport_citizen?: boolean
          max_driving_radius_km?: number | null
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
          available_from_date?: string | null
          availability_note?: string | null
          status?: ProfessionalStatus
          gender?: Gender | null
          education?: string | null
          certificates?: string[]
          daily_occupation?: string | null
          experience_with_genders?: ExperienceWithGender[]
          geography?: string[]
          job_title?: string | null
          phone?: string | null
          address?: string | null
          postal_code?: string | null
          city?: string | null
          region?: string | null
          profile_image_url?: string | null
          profession_type_id?: string | null
          specialization?: string | null
          authorization_note?: string | null
          bio?: string | null
          max_hours_per_week?: number | null
          available_now?: boolean
          can_take_acute?: boolean
          can_work_evening?: boolean
          can_work_weekend?: boolean
          can_work_night?: boolean
          has_drivers_license?: boolean
          has_own_car?: boolean
          can_transport_citizen?: boolean
          max_driving_radius_km?: number | null
          updated_at?: string
          archived_at?: string | null
        }
        Relationships: []
      }
      professional_availability_periods: {
        Row: {
          id: string
          professional_id: string
          period_type: 'VACATION' | 'PAUSE'
          start_date: string
          end_date: string | null
          note: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          professional_id: string
          period_type: 'VACATION' | 'PAUSE'
          start_date: string
          end_date?: string | null
          note?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          period_type?: 'VACATION' | 'PAUSE'
          start_date?: string
          end_date?: string | null
          note?: string | null
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
          file_name: string | null
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
          file_name?: string | null
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
          file_name?: string | null
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
          urgency: CaseUrgency
          case_number: string | null
          citizen_initials: string
          citizen_age_range: AgeRange
          citizen_gender: Gender | null
          citizen_notes: string | null
          weekly_hours: number
          complexity_level: ComplexityLevel
          intake_token: string | null
          intake_contact_name: string | null
          intake_contact_email: string | null
          intake_contact_phone: string | null
          citizen_name: string | null
          citizen_dob: string | null
          legal_basis: 'BARNETS_LOV_32' | 'SEL_76' | 'SEL_85' | 'SEL_99' | null
          expected_duration_months: number | null
          diagnoses: string | null
          daily_function: string | null
          citizen_interests: string | null
          preferred_prof_gender: 'MALE' | 'FEMALE' | 'NO_PREF' | null
          required_languages: string[] | null
          transport_needs: 'JA' | 'NEJ' | null
          geographical_area: string | null
          created_at: string
          updated_at: string
          archived_at: string | null
          data_retention_expires_at: string | null
        }
        Insert: {
          id?: string
          municipality_id: string
          status?: CaseStatus
          urgency?: CaseUrgency
          case_number?: string | null
          citizen_initials: string
          citizen_age_range: AgeRange
          citizen_gender?: Gender | null
          citizen_notes?: string | null
          weekly_hours?: number
          complexity_level?: ComplexityLevel
          intake_token?: string | null
          intake_contact_name?: string | null
          intake_contact_email?: string | null
          intake_contact_phone?: string | null
          citizen_name?: string | null
          citizen_dob?: string | null
          legal_basis?: 'BARNETS_LOV_32' | 'SEL_76' | 'SEL_85' | 'SEL_99' | null
          expected_duration_months?: number | null
          diagnoses?: string | null
          daily_function?: string | null
          citizen_interests?: string | null
          preferred_prof_gender?: 'MALE' | 'FEMALE' | 'NO_PREF' | null
          required_languages?: string[] | null
          transport_needs?: 'JA' | 'NEJ' | null
          geographical_area?: string | null
          created_at?: string
          updated_at?: string
          archived_at?: string | null
          data_retention_expires_at?: string | null
        }
        Update: {
          municipality_id?: string
          status?: CaseStatus
          urgency?: CaseUrgency
          case_number?: string | null
          citizen_initials?: string
          citizen_age_range?: AgeRange
          citizen_gender?: Gender | null
          citizen_notes?: string | null
          weekly_hours?: number
          complexity_level?: ComplexityLevel
          intake_token?: string | null
          intake_contact_name?: string | null
          intake_contact_email?: string | null
          intake_contact_phone?: string | null
          citizen_name?: string | null
          citizen_dob?: string | null
          legal_basis?: 'BARNETS_LOV_32' | 'SEL_76' | 'SEL_85' | 'SEL_99' | null
          expected_duration_months?: number | null
          diagnoses?: string | null
          daily_function?: string | null
          citizen_interests?: string | null
          preferred_prof_gender?: 'MALE' | 'FEMALE' | 'NO_PREF' | null
          required_languages?: string[] | null
          transport_needs?: 'JA' | 'NEJ' | null
          geographical_area?: string | null
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
          overlap_meeting_completed_at: string | null
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
          overlap_meeting_completed_at?: string | null
        }
        Update: {
          incoming_professional_id?: string | null
          status?: HandoverStatus
          handover_note?: string | null
          is_urgent?: boolean
          session_logs_transferred?: boolean
          transferred_session_logs?: string[] | null
          completed_at?: string | null
          overlap_meeting_completed_at?: string | null
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
          work_type: string
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
          work_type: string
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
          work_type?: string
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
          logistics_score: number | null
          eligible: boolean
          ineligibility_reason: string | null
          current_hours_assigned: number
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
          logistics_score?: number | null
          eligible?: boolean
          ineligibility_reason?: string | null
          current_hours_assigned?: number
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
      planned_hours: {
        Row: {
          id: string
          case_id: string
          professional_id: string
          week_start: string
          planned_hours: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          case_id: string
          professional_id: string
          week_start: string
          planned_hours: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          planned_hours?: number
          updated_at?: string
        }
        Relationships: []
      }
      case_documents: {
        Row: {
          id: string
          case_id: string
          file_name: string
          storage_path: string
          mime_type: string | null
          size_bytes: number | null
          description: string | null
          uploaded_by: string
          uploaded_at: string
        }
        Insert: {
          id?: string
          case_id: string
          file_name: string
          storage_path: string
          mime_type?: string | null
          size_bytes?: number | null
          description?: string | null
          uploaded_by: string
          uploaded_at?: string
        }
        Update: {
          file_name?: string
          mime_type?: string | null
          size_bytes?: number | null
          description?: string | null
        }
        Relationships: []
      }
      status_report_requests: {
        Row: {
          id: string
          case_id: string
          professional_id: string
          requested_by: string
          report_type: 'MONTHLY' | 'EXTENDED' | 'FINAL'
          deadline: string
          message: string | null
          status: 'PENDING' | 'ACKNOWLEDGED' | 'SUBMITTED' | 'REVIEWED'
          promised_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          case_id: string
          professional_id: string
          requested_by: string
          report_type: 'MONTHLY' | 'EXTENDED' | 'FINAL'
          deadline: string
          message?: string | null
          status?: 'PENDING' | 'ACKNOWLEDGED' | 'SUBMITTED' | 'REVIEWED'
          promised_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          report_type?: 'MONTHLY' | 'EXTENDED' | 'FINAL'
          deadline?: string
          message?: string | null
          status?: 'PENDING' | 'ACKNOWLEDGED' | 'SUBMITTED' | 'REVIEWED'
          promised_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      status_reports: {
        Row: {
          id: string
          request_id: string
          professional_id: string
          case_id: string
          period_start: string
          period_end: string
          everyday_situation: string | null
          work_focus: string | null
          progress_resources: string | null
          challenges: string | null
          concern_level: 'NONE' | 'MINOR' | 'CONCERN' | null
          concern_text: string | null
          collaboration: string | null
          recommendation: string | null
          overall_assessment: 'ON_TRACK' | 'ADJUSTING' | 'RECOMMEND_CLOSE' | null
          overall_assessment_note: string | null
          submitted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          request_id: string
          professional_id: string
          case_id: string
          period_start: string
          period_end: string
          everyday_situation?: string | null
          work_focus?: string | null
          progress_resources?: string | null
          challenges?: string | null
          concern_level?: 'NONE' | 'MINOR' | 'CONCERN' | null
          concern_text?: string | null
          collaboration?: string | null
          recommendation?: string | null
          overall_assessment?: 'ON_TRACK' | 'ADJUSTING' | 'RECOMMEND_CLOSE' | null
          overall_assessment_note?: string | null
          submitted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          period_start?: string
          period_end?: string
          everyday_situation?: string | null
          work_focus?: string | null
          progress_resources?: string | null
          challenges?: string | null
          concern_level?: 'NONE' | 'MINOR' | 'CONCERN' | null
          concern_text?: string | null
          collaboration?: string | null
          recommendation?: string | null
          overall_assessment?: 'ON_TRACK' | 'ADJUSTING' | 'RECOMMEND_CLOSE' | null
          overall_assessment_note?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profession_types: LookupTable
      competency_types: LookupTable
      method_types: LookupTable
      target_group_types: LookupTable
      work_task_types: LookupTable
      language_types: LookupTable
      certificate_types: LookupTable
      professional_competencies: {
        Row: { professional_id: string; competency_type_id: string }
        Insert: { professional_id: string; competency_type_id: string }
        Update: { professional_id?: string; competency_type_id?: string }
        Relationships: []
      }
      professional_methods: {
        Row: { professional_id: string; method_type_id: string }
        Insert: { professional_id: string; method_type_id: string }
        Update: { professional_id?: string; method_type_id?: string }
        Relationships: []
      }
      professional_target_groups: {
        Row: { professional_id: string; target_group_type_id: string }
        Insert: { professional_id: string; target_group_type_id: string }
        Update: { professional_id?: string; target_group_type_id?: string }
        Relationships: []
      }
      professional_work_tasks: {
        Row: { professional_id: string; work_task_type_id: string }
        Insert: { professional_id: string; work_task_type_id: string }
        Update: { professional_id?: string; work_task_type_id?: string }
        Relationships: []
      }
      professional_languages: {
        Row: { professional_id: string; language_type_id: string }
        Insert: { professional_id: string; language_type_id: string }
        Update: { professional_id?: string; language_type_id?: string }
        Relationships: []
      }
      professional_geography: {
        Row: { professional_id: string; municipality_id: string }
        Insert: { professional_id: string; municipality_id: string }
        Update: { professional_id?: string; municipality_id?: string }
        Relationships: []
      }
      professional_certificates: {
        Row: {
          id: string
          professional_id: string
          certificate_type_id: string | null
          custom_name: string | null
          file_url: string | null
          file_name: string | null
          issued_at: string | null
          expires_at: string | null
          status: 'ACTIVE' | 'EXPIRED' | 'EXPIRING_SOON'
          created_at: string
        }
        Insert: {
          id?: string
          professional_id: string
          certificate_type_id?: string | null
          custom_name?: string | null
          file_url?: string | null
          file_name?: string | null
          issued_at?: string | null
          expires_at?: string | null
          status?: 'ACTIVE' | 'EXPIRED' | 'EXPIRING_SOON'
          created_at?: string
        }
        Update: {
          custom_name?: string | null
          file_url?: string | null
          file_name?: string | null
          issued_at?: string | null
          expires_at?: string | null
          status?: 'ACTIVE' | 'EXPIRED' | 'EXPIRING_SOON'
        }
        Relationships: []
      }
      professional_consents: {
        Row: {
          id: string
          professional_id: string
          consent_type: 'GDPR' | 'PRIVACY' | 'CONFIDENTIALITY' | 'ETHICS' | 'TERMS' | 'DOCUMENT_STORAGE'
          accepted_at: string
          ip_address: string | null
          document_version: string
        }
        Insert: {
          id?: string
          professional_id: string
          consent_type: 'GDPR' | 'PRIVACY' | 'CONFIDENTIALITY' | 'ETHICS' | 'TERMS' | 'DOCUMENT_STORAGE'
          accepted_at?: string
          ip_address?: string | null
          document_version?: string
        }
        Update: never
        Relationships: []
      }
      cms_categories: {
        Row: {
          slug: string
          name: string
          description: string | null
          sort_order: number
        }
        Insert: {
          slug: string
          name: string
          description?: string | null
          sort_order?: number
        }
        Update: {
          name?: string
          description?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      cms_municipalities: {
        Row: {
          slug: string
          name: string
          county: string
          population_approx: number | null
          hero_title: string
          hero_intro: string
          local_context: string
          services_description: string
          meta_title: string
          meta_description: string
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          slug: string
          name: string
          county?: string
          population_approx?: number | null
          hero_title: string
          hero_intro: string
          local_context: string
          services_description: string
          meta_title: string
          meta_description: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          county?: string
          population_approx?: number | null
          hero_title?: string
          hero_intro?: string
          local_context?: string
          services_description?: string
          meta_title?: string
          meta_description?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      cms_articles: {
        Row: {
          id: string
          slug: string
          title: string
          excerpt: string
          content: string
          category: string
          tags: string[]
          is_published: boolean
          published_at: string | null
          reading_time_minutes: number
          meta_title: string | null
          meta_description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          excerpt: string
          content: string
          category: string
          tags?: string[]
          is_published?: boolean
          published_at?: string | null
          reading_time_minutes?: number
          meta_title?: string | null
          meta_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          slug?: string
          title?: string
          excerpt?: string
          content?: string
          category?: string
          tags?: string[]
          is_published?: boolean
          published_at?: string | null
          reading_time_minutes?: number
          meta_title?: string | null
          meta_description?: string | null
          updated_at?: string
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
          urgency: CaseUrgency
          case_number: string | null
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
  | 'CHILD_RECORD'
  | 'DRIVING_LICENSE'
  | 'QUALIFICATION'
  | 'EDUCATION'
  | 'INSURANCE'
  | 'AUTHORIZATION'
  | 'OTHER'

export type DocumentStatus =
  | 'PENDING_UPLOAD'
  | 'UNVERIFIED'
  | 'VERIFIED'
  | 'ARCHIVED'
  | 'MISSING'
  | 'UPLOADED'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRING_SOON'

export type CaseStatus = 'OPEN' | 'MATCHED' | 'PROPOSED' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
export type CaseUrgency = 'NORMAL' | 'HURTIG' | 'AKUT'

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
  | 'FOLLOW_UP_NEEDED'
  | 'STATUS_REPORT_REQUESTED'
  | 'STATUS_REPORT_REMINDER'
  | 'STATUS_REPORT_SUBMITTED'
  | 'GRANT_ACTIVATED'

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
export type CaseDocument = Database['public']['Tables']['case_documents']['Row']
export type PlannedHours = Database['public']['Tables']['planned_hours']['Row']
export type StatusReportRequest = Database['public']['Tables']['status_report_requests']['Row']
export type StatusReport = Database['public']['Tables']['status_reports']['Row']
export type ProfessionTypeRow = Database['public']['Tables']['profession_types']['Row']
export type CompetencyTypeRow = Database['public']['Tables']['competency_types']['Row']
export type MethodTypeRow = Database['public']['Tables']['method_types']['Row']
export type TargetGroupTypeRow = Database['public']['Tables']['target_group_types']['Row']
export type WorkTaskTypeRow = Database['public']['Tables']['work_task_types']['Row']
export type LanguageTypeRow = Database['public']['Tables']['language_types']['Row']
export type CertificateTypeRow = Database['public']['Tables']['certificate_types']['Row']
export type ProfessionalCertificate = Database['public']['Tables']['professional_certificates']['Row']
export type ProfessionalConsent = Database['public']['Tables']['professional_consents']['Row']
export type CmsCategory = Database['public']['Tables']['cms_categories']['Row']
export type CmsMunicipality = Database['public']['Tables']['cms_municipalities']['Row']
export type CmsArticle = Database['public']['Tables']['cms_articles']['Row']
