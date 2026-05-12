export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: "doctor" | "patient"
          name: string | null
          email: string | null
          phone: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
        }
        Insert: {
          id: string
          role: "doctor" | "patient"
          name?: string | null
          email?: string | null
          phone?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          role?: "doctor" | "patient"
          name?: string | null
          email?: string | null
          phone?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
        }
      }
      doctors: {
        Row: {
          id: string
          user_id: string
          specialization: string | null
          consultation_type: "Online" | "Physical" | "Both" | null
          experience_years: number | null
          bio: string | null
          rating: number | null
          is_available: boolean
          fee: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          specialization?: string | null
          consultation_type?: "Online" | "Physical" | "Both" | null
          experience_years?: number | null
          bio?: string | null
          rating?: number | null
          is_available?: boolean
          fee?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          specialization?: string | null
          consultation_type?: "Online" | "Physical" | "Both" | null
          experience_years?: number | null
          bio?: string | null
          rating?: number | null
          is_available?: boolean
          fee?: number | null
          created_at?: string
        }
      }
      availability_slots: {
        Row: {
          id: string
          doctor_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_booked: boolean
          created_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_booked?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          doctor_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          is_booked?: boolean
          created_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          doctor_id: string
          patient_id: string
          slot_id: string | null
          status: "pending" | "confirmed" | "done" | "cancelled"
          notes: string | null
          appointment_at: string
          created_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          patient_id: string
          slot_id?: string | null
          status?: "pending" | "confirmed" | "done" | "cancelled"
          notes?: string | null
          appointment_at: string
          created_at?: string
        }
        Update: {
          id?: string
          doctor_id?: string
          patient_id?: string
          slot_id?: string | null
          status?: "pending" | "confirmed" | "done" | "cancelled"
          notes?: string | null
          appointment_at?: string
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          doctor_id: string
          patient_id: string
          created_at: string
          last_message_at: string | null
        }
        Insert: {
          id?: string
          doctor_id: string
          patient_id: string
          created_at?: string
          last_message_at?: string | null
        }
        Update: {
          id?: string
          doctor_id?: string
          patient_id?: string
          created_at?: string
          last_message_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          is_ai_generated: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          is_ai_generated?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          is_ai_generated?: boolean
          created_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          doctor_id: string
          name: string | null
          contact: string | null
          problem_text: string | null
          captured_by_ai: boolean
          status: "new" | "contacted"
          created_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          name?: string | null
          contact?: string | null
          problem_text?: string | null
          captured_by_ai?: boolean
          status?: "new" | "contacted"
          created_at?: string
        }
        Update: {
          id?: string
          doctor_id?: string
          name?: string | null
          contact?: string | null
          problem_text?: string | null
          captured_by_ai?: boolean
          status?: "new" | "contacted"
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          doctor_id: string
          patient_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          patient_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          doctor_id?: string
          patient_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
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
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof DatabaseWithoutInternals, "public">]

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

export const Constants = {
  public: {
    Enums: {},
  },
} as const
