export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          brand_assets_folder: string | null
          client_type: string[] | null
          company: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          instagram_handle: string | null
          linkedin_url: string | null
          name: string
          notes: string | null
          onboarded_at: string | null
          onboarded_by: string | null
          phone: string | null
          project_goals: string | null
          services_needed: string[] | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          brand_assets_folder?: string | null
          client_type?: string[] | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          instagram_handle?: string | null
          linkedin_url?: string | null
          name: string
          notes?: string | null
          onboarded_at?: string | null
          onboarded_by?: string | null
          phone?: string | null
          project_goals?: string | null
          services_needed?: string[] | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          brand_assets_folder?: string | null
          client_type?: string[] | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          instagram_handle?: string | null
          linkedin_url?: string | null
          name?: string
          notes?: string | null
          onboarded_at?: string | null
          onboarded_by?: string | null
          phone?: string | null
          project_goals?: string | null
          services_needed?: string[] | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      financial_entries: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string | null
          created_by: string | null
          date: string
          description: string | null
          fixed_cost: number | null
          id: string
          operational_hours: number | null
          payment_status: string | null
          project_id: string | null
          service_type: string
          stripe_invoice_id: string | null
          stripe_payment_link: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date: string
          description?: string | null
          fixed_cost?: number | null
          id?: string
          operational_hours?: number | null
          payment_status?: string | null
          project_id?: string | null
          service_type: string
          stripe_invoice_id?: string | null
          stripe_payment_link?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string | null
          fixed_cost?: number | null
          id?: string
          operational_hours?: number | null
          payment_status?: string | null
          project_id?: string | null
          service_type?: string
          stripe_invoice_id?: string | null
          stripe_payment_link?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      google_oauth_tokens: {
        Row: {
          access_token: string
          created_at: string
          google_email: string | null
          id: string
          refresh_token: string | null
          scopes: string[] | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          google_email?: string | null
          id?: string
          refresh_token?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          google_email?: string | null
          id?: string
          refresh_token?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          id: string
          item_name: string
          notes: string | null
          status: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          id?: string
          item_name: string
          notes?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          item_name?: string
          notes?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      inventory_reservations: {
        Row: {
          booking_id: string
          created_at: string
          created_by: string | null
          id: string
          inventory_id: string
          reserved_from: string
          reserved_until: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_id: string
          reserved_from: string
          reserved_until: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_id?: string
          reserved_from?: string
          reserved_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_reservations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "studio_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reservations_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_drafts: {
        Row: {
          created_at: string
          data: Json
          id: string
          step: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          step?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          step?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      performance_logs: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          log_date: string | null
          note: string
          staff_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          log_date?: string | null
          note: string
          staff_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          log_date?: string | null
          note?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_logs_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string | null
          id: string
          phone: string | null
          role_preferences: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role_preferences?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role_preferences?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_documents: {
        Row: {
          client_id: string | null
          created_at: string | null
          document_type: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          project_id: string
          title: string
          uploaded_by: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          document_type: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          project_id: string
          title: string
          uploaded_by?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          document_type?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          project_id?: string
          title?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_intake_canvas: {
        Row: {
          brand_pillars: string[] | null
          competitors: string | null
          created_at: string | null
          created_by: string | null
          id: string
          inspiration_gallery: Json | null
          kickoff_template_enabled: boolean | null
          project_goals: string | null
          project_id: string
          target_audience: string | null
          tone_of_voice: string | null
          updated_at: string | null
        }
        Insert: {
          brand_pillars?: string[] | null
          competitors?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          inspiration_gallery?: Json | null
          kickoff_template_enabled?: boolean | null
          project_goals?: string | null
          project_id: string
          target_audience?: string | null
          tone_of_voice?: string | null
          updated_at?: string | null
        }
        Update: {
          brand_pillars?: string[] | null
          competitors?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          inspiration_gallery?: Json | null
          kickoff_template_enabled?: boolean | null
          project_goals?: string | null
          project_id?: string
          target_audience?: string | null
          tone_of_voice?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_intake_canvas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_knowledge_vault: {
        Row: {
          canvas_id: string | null
          created_at: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          is_locked: boolean | null
          pillar_tags: string[] | null
          project_charter: string
          project_id: string
          tone_tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          canvas_id?: string | null
          created_at?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          is_locked?: boolean | null
          pillar_tags?: string[] | null
          project_charter: string
          project_id: string
          tone_tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          canvas_id?: string | null
          created_at?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          is_locked?: boolean | null
          pillar_tags?: string[] | null
          project_charter?: string
          project_id?: string
          tone_tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_knowledge_vault_canvas_id_fkey"
            columns: ["canvas_id"]
            isOneToOne: false
            referencedRelation: "project_intake_canvas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_knowledge_vault_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_resources: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          display_order: number | null
          id: string
          project_id: string
          resource_type: string
          title: string
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          project_id: string
          resource_type: string
          title: string
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          project_id?: string
          resource_type?: string
          title?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_resources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      public_calendar_tokens: {
        Row: {
          created_at: string | null
          created_by: string
          expires_at: string | null
          id: string
          token: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          id?: string
          token?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          id?: string
          token?: string
        }
        Relationships: []
      }
      signature_requests: {
        Row: {
          booking_id: string | null
          client_id: string | null
          created_at: string | null
          created_by: string | null
          document_type: string
          docusign_envelope_id: string | null
          id: string
          project_id: string | null
          signed_at: string | null
          signed_document_path: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          document_type: string
          docusign_envelope_id?: string | null
          id?: string
          project_id?: string | null
          signed_at?: string | null
          signed_document_path?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          document_type?: string
          docusign_envelope_id?: string | null
          id?: string
          project_id?: string | null
          signed_at?: string | null
          signed_document_path?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signature_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "studio_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signature_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signature_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_profiles: {
        Row: {
          avatar_url: string | null
          contract_file_path: string | null
          created_at: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string
          hire_date: string | null
          id: string
          phone: string | null
          role: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          contract_file_path?: string | null
          created_at?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          contract_file_path?: string | null
          created_at?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      studio_bookings: {
        Row: {
          booked_by: string | null
          booking_type: string
          client_id: string | null
          created_at: string
          date: string
          end_time: string
          equipment_notes: string | null
          event_name: string | null
          id: string
          is_blocked: boolean
          notes: string | null
          start_time: string
          status: string | null
          updated_at: string
        }
        Insert: {
          booked_by?: string | null
          booking_type: string
          client_id?: string | null
          created_at?: string
          date: string
          end_time: string
          equipment_notes?: string | null
          event_name?: string | null
          id?: string
          is_blocked?: boolean
          notes?: string | null
          start_time: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          booked_by?: string | null
          booking_type?: string
          client_id?: string | null
          created_at?: string
          date?: string
          end_time?: string
          equipment_notes?: string | null
          event_name?: string | null
          id?: string
          is_blocked?: boolean
          notes?: string | null
          start_time?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_operations_tasks: {
        Row: {
          assigned_to: string | null
          booking_id: string
          completed_at: string | null
          created_at: string
          id: string
          status: string
          task_name: string
          task_type: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          booking_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          status?: string
          task_name: string
          task_type: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          booking_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          status?: string
          task_name?: string
          task_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_operations_tasks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "studio_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          hours_logged: number | null
          id: string
          internal_notes: string | null
          priority: string
          project_id: string
          shared_notes: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          hours_logged?: number | null
          id?: string
          internal_notes?: string | null
          priority?: string
          project_id: string
          shared_notes?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          hours_logged?: number | null
          id?: string
          internal_notes?: string | null
          priority?: string
          project_id?: string
          shared_notes?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          invited_role: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          invited_role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          invited_role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Relationships: []
      }
      time_logs: {
        Row: {
          created_at: string
          description: string | null
          hours: number
          id: string
          log_date: string
          project_id: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          hours: number
          id?: string
          log_date?: string
          project_id: string
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          hours?: number
          id?: string
          log_date?: string
          project_id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_admin_or_staff: { Args: { _user_id: string }; Returns: boolean }
      is_project_member: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "client"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff", "client"],
    },
  },
} as const
