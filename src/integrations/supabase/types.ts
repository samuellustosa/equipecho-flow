export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      equipments: {
        Row: {
          cleaning_frequency_days: number
          created_at: string
          id: string
          last_cleaning: string | null
          model: string | null
          name: string
          next_cleaning: string
          notes: string | null
          responsible_id: string | null
          sector_id: string | null
          serial_number: string | null
          status: Database["public"]["Enums"]["equipment_status"]
          updated_at: string
        }
        Insert: {
          cleaning_frequency_days?: number
          created_at?: string
          id?: string
          last_cleaning?: string | null
          model?: string | null
          name: string
          next_cleaning: string
          notes?: string | null
          responsible_id?: string | null
          sector_id?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          updated_at?: string
        }
        Update: {
          cleaning_frequency_days?: number
          created_at?: string
          id?: string
          last_cleaning?: string | null
          model?: string | null
          name?: string
          next_cleaning?: string
          notes?: string | null
          responsible_id?: string | null
          sector_id?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipments_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "responsibles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipments_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          id: string
          question: string
          answer: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          question: string
          answer: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          question?: string
          answer?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          id: string
          message: string
          type: Database["public"]["Enums"]["announcement_type"]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          message: string
          type: Database["public"]["Enums"]["announcement_type"]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          message?: string
          type?: Database["public"]["Enums"]["announcement_type"]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          category_id: string | null
          created_at: string
          current_quantity: number
          description: string | null
          id: string
          location_id: string | null
          minimum_quantity: number
          name: string
          status: Database["public"]["Enums"]["inventory_status"]
          unit: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          current_quantity?: number
          description?: string | null
          id?: string
          location_id?: string | null
          minimum_quantity?: number
          name: string
          status?: Database["public"]["Enums"]["inventory_status"]
          unit?: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          current_quantity?: number
          description?: string | null
          id?: string
          location_id?: string | null
          minimum_quantity?: number
          name?: string
          status?: Database["public"]["Enums"]["inventory_status"]
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          low_stock_alerts_enabled: boolean
          overdue_maintenance_alerts_enabled: boolean
          read_notification_ids: string[]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          low_stock_alerts_enabled?: boolean
          overdue_maintenance_alerts_enabled?: boolean
          read_notification_ids?: string[]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
          email?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          low_stock_alerts_enabled?: boolean
          overdue_maintenance_alerts_enabled?: boolean
          read_notification_ids?: string[]
        }
        Relationships: []
      }
      responsibles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          sector_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          sector_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          sector_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "responsibles_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      sectors: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      equipment_status: "operacional" | "manutencao" | "parado"
      inventory_status: "normal" | "baixo" | "critico"
      user_role: "admin" | "manager" | "user"
      announcement_type: "info" | "warning" | "danger" | "success"
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
      equipment_status: ["operacional", "manutencao", "parado"],
      inventory_status: ["normal", "baixo", "critico"],
      user_role: ["admin", "manager", "user"],
      announcement_type: ["info", "warning", "danger", "success"],
    },
  },
} as const
