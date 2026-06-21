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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      dish_logs: {
        Row: {
          dish_id: string
          id: string
          note: string | null
          rating: number | null
          user_restaurant_id: string
        }
        Insert: {
          dish_id: string
          id?: string
          note?: string | null
          rating?: number | null
          user_restaurant_id: string
        }
        Update: {
          dish_id?: string
          id?: string
          note?: string | null
          rating?: number | null
          user_restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dish_logs_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dish_logs_user_restaurant_id_fkey"
            columns: ["user_restaurant_id"]
            isOneToOne: false
            referencedRelation: "user_restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      dishes: {
        Row: {
          added_by: string | null
          created_at: string
          id: string
          name: string
          photo_url: string | null
          restaurant_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          id?: string
          name: string
          photo_url?: string | null
          restaurant_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          id?: string
          name?: string
          photo_url?: string | null
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dishes_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dishes_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      list_restaurants: {
        Row: {
          added_at: string
          list_id: string
          note: string | null
          position: number | null
          restaurant_id: string
        }
        Insert: {
          added_at?: string
          list_id: string
          note?: string | null
          position?: number | null
          restaurant_id: string
        }
        Update: {
          added_at?: string
          list_id?: string
          note?: string | null
          position?: number | null
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_restaurants_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_restaurants_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          cover_photo_url: string | null
          created_at: string
          description: string | null
          emoji: string | null
          id: string
          is_public: boolean
          slug: string | null
          title: string
          user_id: string
        }
        Insert: {
          cover_photo_url?: string | null
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          is_public?: boolean
          slug?: string | null
          title: string
          user_id: string
        }
        Update: {
          cover_photo_url?: string | null
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          is_public?: boolean
          slug?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          display_name: string | null
          followers_count: number
          following_count: number
          id: string
          is_admin: boolean | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          followers_count?: number
          following_count?: number
          id: string
          is_admin?: boolean | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          followers_count?: number
          following_count?: number
          id?: string
          is_admin?: boolean | null
          username?: string | null
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          is_read: boolean
          message: string | null
          restaurant_id: string
          to_user_id: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          is_read?: boolean
          message?: string | null
          restaurant_id: string
          to_user_id: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          is_read?: boolean
          message?: string | null
          restaurant_id?: string
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          cover_photo_url: string | null
          created_at: string
          cuisine_type: string[]
          district: string | null
          google_place_id: string | null
          google_rating: number | null
          google_rating_count: number | null
          id: string
          is_verified: boolean
          latitude: number
          longitude: number
          name: string
          opening_hours: Json | null
          phone: string | null
          price_range: number | null
          saves_count: number
          tags: string[]
          website: string | null
        }
        Insert: {
          address?: string | null
          cover_photo_url?: string | null
          created_at?: string
          cuisine_type?: string[]
          district?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          google_rating_count?: number | null
          id?: string
          is_verified?: boolean
          latitude: number
          longitude: number
          name: string
          opening_hours?: Json | null
          phone?: string | null
          price_range?: number | null
          saves_count?: number
          tags?: string[]
          website?: string | null
        }
        Update: {
          address?: string | null
          cover_photo_url?: string | null
          created_at?: string
          cuisine_type?: string[]
          district?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          google_rating_count?: number | null
          id?: string
          is_verified?: boolean
          latitude?: number
          longitude?: number
          name?: string
          opening_hours?: Json | null
          phone?: string | null
          price_range?: number | null
          saves_count?: number
          tags?: string[]
          website?: string | null
        }
        Relationships: []
      }
      suggestions: {
        Row: {
          address: string | null
          created_at: string | null
          cuisine: string | null
          id: string
          imported_restaurant_id: string | null
          name: string
          notes: string | null
          status: string | null
          submitted_by: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          cuisine?: string | null
          id?: string
          imported_restaurant_id?: string | null
          name: string
          notes?: string | null
          status?: string | null
          submitted_by?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          cuisine?: string | null
          id?: string
          imported_restaurant_id?: string | null
          name?: string
          notes?: string | null
          status?: string | null
          submitted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suggestions_imported_restaurant_id_fkey"
            columns: ["imported_restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestions_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_restaurants: {
        Row: {
          created_at: string
          id: string
          is_public: boolean
          photos: string[]
          rating: number | null
          restaurant_id: string
          review: string | null
          status: string | null
          updated_at: string
          user_id: string
          visited_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean
          photos?: string[]
          rating?: number | null
          restaurant_id: string
          review?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          visited_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean
          photos?: string[]
          rating?: number | null
          restaurant_id?: string
          review?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          visited_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_restaurants_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_restaurants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
