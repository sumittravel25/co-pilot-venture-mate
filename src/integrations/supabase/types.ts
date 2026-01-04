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
      chat_messages: {
        Row: {
          content: string
          context_id: string | null
          context_type: string | null
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      decisions: {
        Row: {
          actual_outcome: string | null
          chosen_option: string
          confidence_level: string | null
          created_at: string
          description: string
          expected_outcome: string | null
          id: string
          idea_id: string | null
          options_considered: string[] | null
          reasoning: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_outcome?: string | null
          chosen_option: string
          confidence_level?: string | null
          created_at?: string
          description: string
          expected_outcome?: string | null
          id?: string
          idea_id?: string | null
          options_considered?: string[] | null
          reasoning?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_outcome?: string | null
          chosen_option?: string
          confidence_level?: string | null
          created_at?: string
          description?: string
          expected_outcome?: string | null
          id?: string
          idea_id?: string | null
          options_considered?: string[] | null
          reasoning?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decisions_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          assumptions: string[] | null
          created_at: string
          id: string
          market_pain: string | null
          niche_focus: string | null
          problem_statement: string | null
          risks: string[] | null
          status: string | null
          target_user: string | null
          title: string
          updated_at: string
          user_id: string
          validation_reasoning: string | null
          validation_score: number | null
        }
        Insert: {
          assumptions?: string[] | null
          created_at?: string
          id?: string
          market_pain?: string | null
          niche_focus?: string | null
          problem_statement?: string | null
          risks?: string[] | null
          status?: string | null
          target_user?: string | null
          title: string
          updated_at?: string
          user_id: string
          validation_reasoning?: string | null
          validation_score?: number | null
        }
        Update: {
          assumptions?: string[] | null
          created_at?: string
          id?: string
          market_pain?: string | null
          niche_focus?: string | null
          problem_statement?: string | null
          risks?: string[] | null
          status?: string | null
          target_user?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          validation_reasoning?: string | null
          validation_score?: number | null
        }
        Relationships: []
      }
      metrics: {
        Row: {
          created_at: string
          id: string
          idea_id: string | null
          metric_type: string
          notes: string | null
          recorded_at: string
          user_id: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id?: string | null
          metric_type: string
          notes?: string | null
          recorded_at?: string
          user_id: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string | null
          metric_type?: string
          notes?: string | null
          recorded_at?: string
          user_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "metrics_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          constraints: string | null
          created_at: string
          full_name: string | null
          goals: string | null
          id: string
          skills: string[] | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          constraints?: string | null
          created_at?: string
          full_name?: string | null
          goals?: string | null
          id?: string
          skills?: string[] | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          constraints?: string | null
          created_at?: string
          full_name?: string | null
          goals?: string | null
          id?: string
          skills?: string[] | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      roadmap_steps: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          roadmap_id: string
          step_number: number
          title: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          roadmap_id: string
          step_number: number
          title: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          roadmap_id?: string
          step_number?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_steps_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmaps: {
        Row: {
          created_at: string
          estimated_build_time: string | null
          first_user_path: string | null
          id: string
          idea_id: string
          mvp_scope: string | null
          tech_stack: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estimated_build_time?: string | null
          first_user_path?: string | null
          id?: string
          idea_id: string
          mvp_scope?: string | null
          tech_stack?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          estimated_build_time?: string | null
          first_user_path?: string | null
          id?: string
          idea_id?: string
          mvp_scope?: string | null
          tech_stack?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmaps_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_reviews: {
        Row: {
          created_at: string
          generated_at: string
          hard_truth: string | null
          id: string
          key_learnings: string | null
          next_priorities: string | null
          user_id: string
          week_end: string
          week_start: string
          what_didnt_work: string | null
          what_worked: string | null
        }
        Insert: {
          created_at?: string
          generated_at?: string
          hard_truth?: string | null
          id?: string
          key_learnings?: string | null
          next_priorities?: string | null
          user_id: string
          week_end: string
          week_start: string
          what_didnt_work?: string | null
          what_worked?: string | null
        }
        Update: {
          created_at?: string
          generated_at?: string
          hard_truth?: string | null
          id?: string
          key_learnings?: string | null
          next_priorities?: string | null
          user_id?: string
          week_end?: string
          week_start?: string
          what_didnt_work?: string | null
          what_worked?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
