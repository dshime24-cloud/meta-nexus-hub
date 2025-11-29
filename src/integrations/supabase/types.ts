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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      character_attributes: {
        Row: {
          attention: number | null
          character_id: string
          coordination: number | null
          id: string
          intellect: number | null
          prowess: number | null
          vigor: number | null
          willpower: number | null
        }
        Insert: {
          attention?: number | null
          character_id: string
          coordination?: number | null
          id?: string
          intellect?: number | null
          prowess?: number | null
          vigor?: number | null
          willpower?: number | null
        }
        Update: {
          attention?: number | null
          character_id?: string
          coordination?: number | null
          id?: string
          intellect?: number | null
          prowess?: number | null
          vigor?: number | null
          willpower?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "character_attributes_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: true
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_powers: {
        Row: {
          character_id: string
          custom_name: string | null
          description: string | null
          extras: string | null
          id: string
          level: number | null
          limitations: string | null
          power_id: string | null
        }
        Insert: {
          character_id: string
          custom_name?: string | null
          description?: string | null
          extras?: string | null
          id?: string
          level?: number | null
          limitations?: string | null
          power_id?: string | null
        }
        Update: {
          character_id?: string
          custom_name?: string | null
          description?: string | null
          extras?: string | null
          id?: string
          level?: number | null
          limitations?: string | null
          power_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_powers_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_powers_power_id_fkey"
            columns: ["power_id"]
            isOneToOne: false
            referencedRelation: "powers_library"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          age: number | null
          alias: string | null
          appearance: string | null
          backstory: string | null
          classification: string
          created_at: string | null
          determination_points: number | null
          energy: number | null
          folder: string | null
          gender: string | null
          height: number | null
          id: string
          image_url: string | null
          level: number | null
          location: string | null
          motivation: string | null
          name: string
          origin_story: string | null
          quote: string | null
          race: string | null
          threat_level: number | null
          type: string
          updated_at: string | null
          weight: number | null
          xp: number | null
        }
        Insert: {
          age?: number | null
          alias?: string | null
          appearance?: string | null
          backstory?: string | null
          classification: string
          created_at?: string | null
          determination_points?: number | null
          energy?: number | null
          folder?: string | null
          gender?: string | null
          height?: number | null
          id?: string
          image_url?: string | null
          level?: number | null
          location?: string | null
          motivation?: string | null
          name: string
          origin_story?: string | null
          quote?: string | null
          race?: string | null
          threat_level?: number | null
          type: string
          updated_at?: string | null
          weight?: number | null
          xp?: number | null
        }
        Update: {
          age?: number | null
          alias?: string | null
          appearance?: string | null
          backstory?: string | null
          classification?: string
          created_at?: string | null
          determination_points?: number | null
          energy?: number | null
          folder?: string | null
          gender?: string | null
          height?: number | null
          id?: string
          image_url?: string | null
          level?: number | null
          location?: string | null
          motivation?: string | null
          name?: string
          origin_story?: string | null
          quote?: string | null
          race?: string | null
          threat_level?: number | null
          type?: string
          updated_at?: string | null
          weight?: number | null
          xp?: number | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          latitude: number
          longitude: number
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          latitude: number
          longitude: number
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          latitude?: number
          longitude?: number
          name?: string
        }
        Relationships: []
      }
      mission_participants: {
        Row: {
          character_id: string
          id: string
          joined_at: string | null
          mission_id: string
          role: string | null
        }
        Insert: {
          character_id: string
          id?: string
          joined_at?: string | null
          mission_id: string
          role?: string | null
        }
        Update: {
          character_id?: string
          id?: string
          joined_at?: string | null
          mission_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mission_participants_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_participants_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_timeline: {
        Row: {
          description: string
          event_date: string
          event_type: string
          id: string
          metadata: Json | null
          mission_id: string
        }
        Insert: {
          description: string
          event_date?: string
          event_type: string
          id?: string
          metadata?: Json | null
          mission_id: string
        }
        Update: {
          description?: string
          event_date?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          mission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_timeline_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          created_at: string
          description: string | null
          difficulty: string
          end_date: string | null
          id: string
          location: string | null
          start_date: string | null
          status: string
          threat_level: number | null
          title: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty: string
          end_date?: string | null
          id?: string
          location?: string | null
          start_date?: string | null
          status?: string
          threat_level?: number | null
          title: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: string
          end_date?: string | null
          id?: string
          location?: string | null
          start_date?: string | null
          status?: string
          threat_level?: number | null
          title?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: []
      }
      powers_library: {
        Row: {
          base_level: number | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          base_level?: number | null
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          base_level?: number | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      relationships: {
        Row: {
          bonus: string | null
          character_id: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          related_character_id: string | null
          relationship_type: string
        }
        Insert: {
          bonus?: string | null
          character_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          related_character_id?: string | null
          relationship_type: string
        }
        Update: {
          bonus?: string | null
          character_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          related_character_id?: string | null
          relationship_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationships_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_related_character_id_fkey"
            columns: ["related_character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_items: {
        Row: {
          cost: number
          created_at: string | null
          description: string | null
          effect: string | null
          id: string
          name: string
          type: string
          unlimited: boolean | null
        }
        Insert: {
          cost: number
          created_at?: string | null
          description?: string | null
          effect?: string | null
          id?: string
          name: string
          type: string
          unlimited?: boolean | null
        }
        Update: {
          cost?: number
          created_at?: string | null
          description?: string | null
          effect?: string | null
          id?: string
          name?: string
          type?: string
          unlimited?: boolean | null
        }
        Relationships: []
      }
      story_arc_characters: {
        Row: {
          character_id: string
          id: string
          joined_at: string | null
          role: string | null
          story_arc_id: string
        }
        Insert: {
          character_id: string
          id?: string
          joined_at?: string | null
          role?: string | null
          story_arc_id: string
        }
        Update: {
          character_id?: string
          id?: string
          joined_at?: string | null
          role?: string | null
          story_arc_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_arc_characters_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_arc_characters_story_arc_id_fkey"
            columns: ["story_arc_id"]
            isOneToOne: false
            referencedRelation: "story_arcs"
            referencedColumns: ["id"]
          },
        ]
      }
      story_arc_missions: {
        Row: {
          chapter_id: string | null
          id: string
          mission_id: string
          sequence_order: number | null
          story_arc_id: string
        }
        Insert: {
          chapter_id?: string | null
          id?: string
          mission_id: string
          sequence_order?: number | null
          story_arc_id: string
        }
        Update: {
          chapter_id?: string | null
          id?: string
          mission_id?: string
          sequence_order?: number | null
          story_arc_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_arc_missions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "story_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_arc_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_arc_missions_story_arc_id_fkey"
            columns: ["story_arc_id"]
            isOneToOne: false
            referencedRelation: "story_arcs"
            referencedColumns: ["id"]
          },
        ]
      }
      story_arcs: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          image_url: string | null
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      story_chapters: {
        Row: {
          chapter_number: number
          created_at: string
          description: string | null
          id: string
          status: string
          story_arc_id: string
          title: string
          updated_at: string
        }
        Insert: {
          chapter_number?: number
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          story_arc_id: string
          title: string
          updated_at?: string
        }
        Update: {
          chapter_number?: number
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          story_arc_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_chapters_story_arc_id_fkey"
            columns: ["story_arc_id"]
            isOneToOne: false
            referencedRelation: "story_arcs"
            referencedColumns: ["id"]
          },
        ]
      }
      story_timeline: {
        Row: {
          chapter_id: string | null
          description: string | null
          event_date: string
          event_type: string
          id: string
          metadata: Json | null
          story_arc_id: string
          title: string
        }
        Insert: {
          chapter_id?: string | null
          description?: string | null
          event_date?: string
          event_type: string
          id?: string
          metadata?: Json | null
          story_arc_id: string
          title: string
        }
        Update: {
          chapter_id?: string | null
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          story_arc_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_timeline_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "story_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_timeline_story_arc_id_fkey"
            columns: ["story_arc_id"]
            isOneToOne: false
            referencedRelation: "story_arcs"
            referencedColumns: ["id"]
          },
        ]
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
