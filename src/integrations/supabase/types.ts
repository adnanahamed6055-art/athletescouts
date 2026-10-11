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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          created_at: string
          opportunity_id: string
          organiser_note: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          opportunity_id: string
          organiser_note?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          opportunity_id?: string
          organiser_note?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_stats: {
        Row: {
          created_at: string
          id: string
          metric: string
          recorded_on: string
          unit: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          metric: string
          recorded_on?: string
          unit?: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          metric?: string
          recorded_on?: string
          unit?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      athlete_verifications: {
        Row: {
          athlete_ref: string
          created_at: string
          document_paths: string[]
          emirate: string
          guardian_consent: boolean
          id: string
          kind: string
          org_name: string
          review_note: string
          reviewed_at: string | null
          reviewed_by: string | null
          sport: string
          status: string
          team_grade: string
          updated_at: string
          user_id: string
        }
        Insert: {
          athlete_ref?: string
          created_at?: string
          document_paths?: string[]
          emirate?: string
          guardian_consent?: boolean
          id?: string
          kind: string
          org_name: string
          review_note?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sport?: string
          status?: string
          team_grade?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          athlete_ref?: string
          created_at?: string
          document_paths?: string[]
          emirate?: string
          guardian_consent?: boolean
          id?: string
          kind?: string
          org_name?: string
          review_note?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sport?: string
          status?: string
          team_grade?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coach_verifications: {
        Row: {
          created_at: string
          document_path: string | null
          id: string
          issuing_body: string
          license_no: string
          note: string
          organisation: string
          review_note: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_path?: string | null
          id?: string
          issuing_body: string
          license_no: string
          note?: string
          organisation?: string
          review_note?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_path?: string | null
          id?: string
          issuing_body?: string
          license_no?: string
          note?: string
          organisation?: string
          review_note?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_enrollments: {
        Row: {
          created_at: string
          id: string
          message: string
          position: string
          status: string
          target_id: string
          target_name: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string
          position?: string
          status?: string
          target_id: string
          target_name?: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          position?: string
          status?: string
          target_id?: string
          target_name?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
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
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          entity_id: string | null
          id: string
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          created_at: string
          created_by: string | null
          deadline: string
          description: string
          id: string
          kind: Database["public"]["Enums"]["opportunity_kind"]
          level: string
          location: string
          org_name: string
          positions: string[]
          registration_url: string | null
          sport: string
          spots_total: number
          starts_on: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deadline: string
          description?: string
          id?: string
          kind: Database["public"]["Enums"]["opportunity_kind"]
          level?: string
          location: string
          org_name: string
          positions?: string[]
          registration_url?: string | null
          sport: string
          spots_total?: number
          starts_on: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deadline?: string
          description?: string
          id?: string
          kind?: Database["public"]["Enums"]["opportunity_kind"]
          level?: string
          location?: string
          org_name?: string
          positions?: string[]
          registration_url?: string | null
          sport?: string
          spots_total?: number
          starts_on?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_saves: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_saves_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          is_highlight: boolean
          media_type: string
          media_url: string | null
        }
        Insert: {
          author_id: string
          body?: string
          created_at?: string
          id?: string
          is_highlight?: boolean
          media_type?: string
          media_url?: string | null
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          is_highlight?: boolean
          media_type?: string
          media_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
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
          cover_url: string | null
          created_at: string
          dob: string | null
          facilities: string | null
          full_name: string | null
          height_cm: number | null
          id: string
          is_private: boolean
          last_seen_at: string | null
          license_no: string | null
          location: string | null
          onboarded: boolean
          org_name: string | null
          position: string | null
          region: string | null
          school: string | null
          scouting_categories: string[]
          show_activity: boolean
          sport: string | null
          updated_at: string
          username: string | null
          video_links: string[]
          weight_kg: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          dob?: string | null
          facilities?: string | null
          full_name?: string | null
          height_cm?: number | null
          id: string
          is_private?: boolean
          last_seen_at?: string | null
          license_no?: string | null
          location?: string | null
          onboarded?: boolean
          org_name?: string | null
          position?: string | null
          region?: string | null
          school?: string | null
          scouting_categories?: string[]
          show_activity?: boolean
          sport?: string | null
          updated_at?: string
          username?: string | null
          video_links?: string[]
          weight_kg?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          dob?: string | null
          facilities?: string | null
          full_name?: string | null
          height_cm?: number | null
          id?: string
          is_private?: boolean
          last_seen_at?: string | null
          license_no?: string | null
          location?: string | null
          onboarded?: boolean
          org_name?: string | null
          position?: string | null
          region?: string | null
          school?: string | null
          scouting_categories?: string[]
          show_activity?: boolean
          sport?: string | null
          updated_at?: string
          username?: string | null
          video_links?: string[]
          weight_kg?: number | null
        }
        Relationships: []
      }
      saved_opportunities: {
        Row: {
          created_at: string
          opportunity_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          opportunity_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          opportunity_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_opportunities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_opportunities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scoutai_messages: {
        Row: {
          created_at: string
          id: string
          message_id: string
          parts: Json
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          parts?: Json
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          parts?: Json
          role?: string
          user_id?: string
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
      venues: {
        Row: {
          address: string
          category: string
          city: string
          created_at: string
          facilities: string[]
          hours: string | null
          id: string
          lat: number
          lng: number
          name: string
          phone: string | null
          sports: string[]
          website: string | null
        }
        Insert: {
          address?: string
          category?: string
          city?: string
          created_at?: string
          facilities?: string[]
          hours?: string | null
          id?: string
          lat: number
          lng: number
          name: string
          phone?: string | null
          sports?: string[]
          website?: string | null
        }
        Update: {
          address?: string
          category?: string
          city?: string
          created_at?: string
          facilities?: string[]
          hours?: string | null
          id?: string
          lat?: number
          lng?: number
          name?: string
          phone?: string | null
          sports?: string[]
          website?: string | null
        }
        Relationships: []
      }
      verification_ai_reviews: {
        Row: {
          created_at: string
          error: string | null
          finished_at: string | null
          id: string
          model: string
          result: Json | null
          run_key: string
          status: string
          verification_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          model: string
          result?: Json | null
          run_key: string
          status?: string
          verification_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          model?: string
          result?: Json | null
          run_key?: string
          status?: string
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_ai_reviews_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "athlete_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      athlete_verified_badges: {
        Args: never
        Returns: {
          kind: string
          org_name: string
          reviewed_at: string
          user_id: string
        }[]
      }
      can_see_post: { Args: { _post: string }; Returns: boolean }
      can_see_profile: { Args: { _id: string }; Returns: boolean }
      has_any_role: { Args: { _user_id: string }; Returns: boolean }
      has_opportunity_link: { Args: { _opp: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      media_owner_visible: { Args: { _name: string }; Returns: boolean }
      opportunity_counts: {
        Args: never
        Returns: {
          applied: number
          opportunity_id: string
        }[]
      }
      verified_coach_ids: {
        Args: never
        Returns: {
          user_id: string
        }[]
      }
    }
    Enums: {
      app_role: "athlete" | "coach" | "club_manager" | "scout" | "admin"
      opportunity_kind: "trial" | "tryout" | "showcase" | "camp" | "tournament"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["athlete", "coach", "club_manager", "scout", "admin"],
      opportunity_kind: ["trial", "tryout", "showcase", "camp", "tournament"],
    },
  },
} as const
