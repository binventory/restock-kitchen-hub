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
      ad_clicks: {
        Row: {
          ad_id: string
          clicked_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          ad_id: string
          clicked_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          ad_id?: string
          clicked_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_clicks_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_impressions: {
        Row: {
          ad_id: string
          household_id: string | null
          id: string
          shown_at: string
          user_id: string | null
        }
        Insert: {
          ad_id: string
          household_id?: string | null
          id?: string
          shown_at?: string
          user_id?: string | null
        }
        Update: {
          ad_id?: string
          household_id?: string | null
          id?: string
          shown_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_impressions_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      admin_team: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          permissions: Json
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permissions?: Json
          role?: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permissions?: Json
          role?: Database["public"]["Enums"]["admin_role"]
          user_id?: string
        }
        Relationships: []
      }
      ads: {
        Row: {
          ad_type: string | null
          advertiser_name: string | null
          created_at: string
          cta_text: string | null
          cta_url: string | null
          description: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          priority: number
          starts_at: string | null
          target_product_groups: string[] | null
          target_sections: string[] | null
          title: string
        }
        Insert: {
          ad_type?: string | null
          advertiser_name?: string | null
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          priority?: number
          starts_at?: string | null
          target_product_groups?: string[] | null
          target_sections?: string[] | null
          title: string
        }
        Update: {
          ad_type?: string | null
          advertiser_name?: string | null
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          priority?: number
          starts_at?: string | null
          target_product_groups?: string[] | null
          target_sections?: string[] | null
          title?: string
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          cost_usd: number | null
          created_at: string
          feature: string | null
          household_id: string | null
          id: string
          latency_ms: number | null
          model: string | null
          prompt_length: number | null
          provider: string | null
          request_type: string | null
          tokens_input: number | null
          tokens_output: number | null
          tokens_total: number | null
          user_id: string
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string
          feature?: string | null
          household_id?: string | null
          id?: string
          latency_ms?: number | null
          model?: string | null
          prompt_length?: number | null
          provider?: string | null
          request_type?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
          tokens_total?: number | null
          user_id: string
        }
        Update: {
          cost_usd?: number | null
          created_at?: string
          feature?: string | null
          household_id?: string | null
          id?: string
          latency_ms?: number | null
          model?: string | null
          prompt_length?: number | null
          provider?: string | null
          request_type?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
          tokens_total?: number | null
          user_id?: string
        }
        Relationships: []
      }
      ai_usage_overrides: {
        Row: {
          bonus_requests: number
          created_at: string
          granted_by_admin_id: string | null
          id: string
          note: string | null
          user_id: string
          valid_month: string | null
        }
        Insert: {
          bonus_requests?: number
          created_at?: string
          granted_by_admin_id?: string | null
          id?: string
          note?: string | null
          user_id: string
          valid_month?: string | null
        }
        Update: {
          bonus_requests?: number
          created_at?: string
          granted_by_admin_id?: string | null
          id?: string
          note?: string | null
          user_id?: string
          valid_month?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          category: string | null
          description: string | null
          id: string
          is_secret: boolean
          key: string
          updated_at: string
          updated_by: string | null
          value: string | null
        }
        Insert: {
          category?: string | null
          description?: string | null
          id?: string
          is_secret?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          category?: string | null
          description?: string | null
          id?: string
          is_secret?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      cookie_consents: {
        Row: {
          accepted_at: string
          analytics: boolean
          anonymous_id: string | null
          essential: boolean
          id: string
          marketing: boolean
          user_id: string | null
        }
        Insert: {
          accepted_at?: string
          analytics?: boolean
          anonymous_id?: string | null
          essential?: boolean
          id?: string
          marketing?: boolean
          user_id?: string | null
        }
        Update: {
          accepted_at?: string
          analytics?: boolean
          anonymous_id?: string | null
          essential?: boolean
          id?: string
          marketing?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          amount_off: number | null
          code: string
          created_at: string
          expires_at: string | null
          free_days: number | null
          id: string
          max_uses: number | null
          percent_off: number | null
          plan_id: string | null
          popup_message: string | null
          popup_title: string | null
          show_as_popup: boolean
          stripe_coupon_id: string | null
          type: string
          uses_count: number
        }
        Insert: {
          active?: boolean
          amount_off?: number | null
          code: string
          created_at?: string
          expires_at?: string | null
          free_days?: number | null
          id?: string
          max_uses?: number | null
          percent_off?: number | null
          plan_id?: string | null
          popup_message?: string | null
          popup_title?: string | null
          show_as_popup?: boolean
          stripe_coupon_id?: string | null
          type?: string
          uses_count?: number
        }
        Update: {
          active?: boolean
          amount_off?: number | null
          code?: string
          created_at?: string
          expires_at?: string | null
          free_days?: number | null
          id?: string
          max_uses?: number | null
          percent_off?: number | null
          plan_id?: string | null
          popup_message?: string | null
          popup_title?: string | null
          show_as_popup?: boolean
          stripe_coupon_id?: string | null
          type?: string
          uses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      data_export_requests: {
        Row: {
          completed_at: string | null
          file_url: string | null
          id: string
          requested_at: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          file_url?: string | null
          id?: string
          requested_at?: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          file_url?: string | null
          id?: string
          requested_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      household_invites: {
        Row: {
          accepted: boolean
          created_at: string
          created_by: string
          household_id: string
          id: string
          invited_email: string
          token: string
        }
        Insert: {
          accepted?: boolean
          created_at?: string
          created_by: string
          household_id: string
          id?: string
          invited_email: string
          token?: string
        }
        Update: {
          accepted?: boolean
          created_at?: string
          created_by?: string
          household_id?: string
          id?: string
          invited_email?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_invites_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_members: {
        Row: {
          created_at: string
          household_id: string
          id: string
          is_default: boolean
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          is_default?: boolean
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          is_default?: boolean
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          created_at: string
          expiry_date: string | null
          household_id: string
          id: string
          limit_threshold: number
          product_group_id: string | null
          product_id: string | null
          quantity: number
          section_id: string | null
          unit: Database["public"]["Enums"]["inventory_unit"]
          updated_at: string
          user_product_id: string | null
        }
        Insert: {
          created_at?: string
          expiry_date?: string | null
          household_id: string
          id?: string
          limit_threshold?: number
          product_group_id?: string | null
          product_id?: string | null
          quantity?: number
          section_id?: string | null
          unit?: Database["public"]["Enums"]["inventory_unit"]
          updated_at?: string
          user_product_id?: string | null
        }
        Update: {
          created_at?: string
          expiry_date?: string | null
          household_id?: string
          id?: string
          limit_threshold?: number
          product_group_id?: string | null
          product_id?: string | null
          quantity?: number
          section_id?: string | null
          unit?: Database["public"]["Enums"]["inventory_unit"]
          updated_at?: string
          user_product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_product_group_id_fkey"
            columns: ["product_group_id"]
            isOneToOne: false
            referencedRelation: "product_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_user_product_id_fkey"
            columns: ["user_product_id"]
            isOneToOne: false
            referencedRelation: "user_products"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_clicks: {
        Row: {
          clicked_at: string
          id: string
          offer_id: string
          revealed_coupon: boolean
          user_id: string | null
        }
        Insert: {
          clicked_at?: string
          id?: string
          offer_id: string
          revealed_coupon?: boolean
          user_id?: string | null
        }
        Update: {
          clicked_at?: string
          id?: string
          offer_id?: string
          revealed_coupon?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offer_clicks_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_clicks_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_views: {
        Row: {
          id: string
          offer_id: string
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          offer_id: string
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          offer_id?: string
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_views_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_views_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          clicks_count: number
          coupon_code: string | null
          created_at: string
          description: string | null
          discount_value: number | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          max_clicks: number | null
          max_views: number | null
          offer_type: string | null
          product_group_id: string | null
          product_id: string | null
          section_id: string | null
          sponsor_name: string | null
          sponsor_paid_eur: number | null
          starts_at: string | null
          supermarket: string | null
          target_plans: string[] | null
          title: string
          views_count: number
        }
        Insert: {
          clicks_count?: number
          coupon_code?: string | null
          created_at?: string
          description?: string | null
          discount_value?: number | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          max_clicks?: number | null
          max_views?: number | null
          offer_type?: string | null
          product_group_id?: string | null
          product_id?: string | null
          section_id?: string | null
          sponsor_name?: string | null
          sponsor_paid_eur?: number | null
          starts_at?: string | null
          supermarket?: string | null
          target_plans?: string[] | null
          title: string
          views_count?: number
        }
        Update: {
          clicks_count?: number
          coupon_code?: string | null
          created_at?: string
          description?: string | null
          discount_value?: number | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          max_clicks?: number | null
          max_views?: number | null
          offer_type?: string | null
          product_group_id?: string | null
          product_id?: string | null
          section_id?: string | null
          sponsor_name?: string | null
          sponsor_paid_eur?: number | null
          starts_at?: string | null
          supermarket?: string | null
          target_plans?: string[] | null
          title?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "offers_product_group_id_fkey"
            columns: ["product_group_id"]
            isOneToOne: false
            referencedRelation: "product_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          ads_shown: boolean
          ai_assistant_enabled: boolean
          ai_requests_per_month: number
          created_at: string
          delivery_integration_enabled: boolean
          description: string | null
          diet_mode_enabled: boolean
          display_order: number
          expiry_alerts_enabled: boolean
          halal_filter_enabled: boolean
          health_profile_enabled: boolean
          id: string
          is_active: boolean
          max_household_members: number
          max_households: number
          max_scanners: number
          name: string
          price_comparison_enabled: boolean
          price_monthly: number
          price_yearly: number
          slug: string
        }
        Insert: {
          ads_shown?: boolean
          ai_assistant_enabled?: boolean
          ai_requests_per_month?: number
          created_at?: string
          delivery_integration_enabled?: boolean
          description?: string | null
          diet_mode_enabled?: boolean
          display_order?: number
          expiry_alerts_enabled?: boolean
          halal_filter_enabled?: boolean
          health_profile_enabled?: boolean
          id?: string
          is_active?: boolean
          max_household_members?: number
          max_households?: number
          max_scanners?: number
          name: string
          price_comparison_enabled?: boolean
          price_monthly?: number
          price_yearly?: number
          slug: string
        }
        Update: {
          ads_shown?: boolean
          ai_assistant_enabled?: boolean
          ai_requests_per_month?: number
          created_at?: string
          delivery_integration_enabled?: boolean
          description?: string | null
          diet_mode_enabled?: boolean
          display_order?: number
          expiry_alerts_enabled?: boolean
          halal_filter_enabled?: boolean
          health_profile_enabled?: boolean
          id?: string
          is_active?: boolean
          max_household_members?: number
          max_households?: number
          max_scanners?: number
          name?: string
          price_comparison_enabled?: boolean
          price_monthly?: number
          price_yearly?: number
          slug?: string
        }
        Relationships: []
      }
      popup_notifications: {
        Row: {
          coupon_id: string | null
          created_at: string
          ends_at: string | null
          id: string
          is_active: boolean
          message: string | null
          referral_link_enabled: boolean
          starts_at: string | null
          target_plan: string | null
          title: string
          type: string | null
        }
        Insert: {
          coupon_id?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          message?: string | null
          referral_link_enabled?: boolean
          starts_at?: string | null
          target_plan?: string | null
          title: string
          type?: string | null
        }
        Update: {
          coupon_id?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          message?: string | null
          referral_link_enabled?: boolean
          starts_at?: string | null
          target_plan?: string | null
          title?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "popup_notifications_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "popup_notifications_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons_public"
            referencedColumns: ["id"]
          },
        ]
      }
      popup_seen: {
        Row: {
          id: string
          popup_id: string
          seen_at: string
          user_id: string
        }
        Insert: {
          id?: string
          popup_id: string
          seen_at?: string
          user_id: string
        }
        Update: {
          id?: string
          popup_id?: string
          seen_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "popup_seen_popup_id_fkey"
            columns: ["popup_id"]
            isOneToOne: false
            referencedRelation: "popup_notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "popup_seen_popup_id_fkey"
            columns: ["popup_id"]
            isOneToOne: false
            referencedRelation: "popup_notifications_public"
            referencedColumns: ["id"]
          },
        ]
      }
      product_groups: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          is_default: boolean
          keywords: string[]
          name: string
          section_id: string | null
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          is_default?: boolean
          keywords?: string[]
          name: string
          section_id?: string | null
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          is_default?: boolean
          keywords?: string[]
          name?: string
          section_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_groups_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allergens: string[] | null
          available_stores: string[] | null
          barcode: string | null
          brand: string | null
          calories_100g: number | null
          calories_serving: number | null
          carbohydrates_100g: number | null
          categories_tags: string[] | null
          category: string | null
          created_at: string
          ecoscore: Database["public"]["Enums"]["ecoscore_grade"] | null
          fat_100g: number | null
          fiber_100g: number | null
          food_group: string | null
          food_groups_tags: string[] | null
          generic_name: string | null
          halal_certified: boolean | null
          has_palm_oil: boolean | null
          id: string
          image_url: string | null
          ingredients_analysis: string[] | null
          ingredients_text: string | null
          is_approved: boolean
          is_gluten_free: boolean | null
          is_vegan: boolean | null
          is_vegetarian: boolean | null
          keywords: string[] | null
          labels: string[] | null
          name: string
          name_ar: string | null
          name_de: string | null
          name_en: string | null
          name_fr: string | null
          nova_group: number | null
          nutrient_levels: Json | null
          nutriscore: Database["public"]["Enums"]["nutriscore_grade"] | null
          product_type: string | null
          proteins_100g: number | null
          quantity_unit: string | null
          quantity_value: number | null
          salt_100g: number | null
          saturated_fat_100g: number | null
          serving_size_g: number | null
          source: Database["public"]["Enums"]["product_source"]
          submitted_by_user_id: string | null
          sugars_100g: number | null
          traces_allergens: string[] | null
          updated_at: string
        }
        Insert: {
          allergens?: string[] | null
          available_stores?: string[] | null
          barcode?: string | null
          brand?: string | null
          calories_100g?: number | null
          calories_serving?: number | null
          carbohydrates_100g?: number | null
          categories_tags?: string[] | null
          category?: string | null
          created_at?: string
          ecoscore?: Database["public"]["Enums"]["ecoscore_grade"] | null
          fat_100g?: number | null
          fiber_100g?: number | null
          food_group?: string | null
          food_groups_tags?: string[] | null
          generic_name?: string | null
          halal_certified?: boolean | null
          has_palm_oil?: boolean | null
          id?: string
          image_url?: string | null
          ingredients_analysis?: string[] | null
          ingredients_text?: string | null
          is_approved?: boolean
          is_gluten_free?: boolean | null
          is_vegan?: boolean | null
          is_vegetarian?: boolean | null
          keywords?: string[] | null
          labels?: string[] | null
          name: string
          name_ar?: string | null
          name_de?: string | null
          name_en?: string | null
          name_fr?: string | null
          nova_group?: number | null
          nutrient_levels?: Json | null
          nutriscore?: Database["public"]["Enums"]["nutriscore_grade"] | null
          product_type?: string | null
          proteins_100g?: number | null
          quantity_unit?: string | null
          quantity_value?: number | null
          salt_100g?: number | null
          saturated_fat_100g?: number | null
          serving_size_g?: number | null
          source?: Database["public"]["Enums"]["product_source"]
          submitted_by_user_id?: string | null
          sugars_100g?: number | null
          traces_allergens?: string[] | null
          updated_at?: string
        }
        Update: {
          allergens?: string[] | null
          available_stores?: string[] | null
          barcode?: string | null
          brand?: string | null
          calories_100g?: number | null
          calories_serving?: number | null
          carbohydrates_100g?: number | null
          categories_tags?: string[] | null
          category?: string | null
          created_at?: string
          ecoscore?: Database["public"]["Enums"]["ecoscore_grade"] | null
          fat_100g?: number | null
          fiber_100g?: number | null
          food_group?: string | null
          food_groups_tags?: string[] | null
          generic_name?: string | null
          halal_certified?: boolean | null
          has_palm_oil?: boolean | null
          id?: string
          image_url?: string | null
          ingredients_analysis?: string[] | null
          ingredients_text?: string | null
          is_approved?: boolean
          is_gluten_free?: boolean | null
          is_vegan?: boolean | null
          is_vegetarian?: boolean | null
          keywords?: string[] | null
          labels?: string[] | null
          name?: string
          name_ar?: string | null
          name_de?: string | null
          name_en?: string | null
          name_fr?: string | null
          nova_group?: number | null
          nutrient_levels?: Json | null
          nutriscore?: Database["public"]["Enums"]["nutriscore_grade"] | null
          product_type?: string | null
          proteins_100g?: number | null
          quantity_unit?: string | null
          quantity_value?: number | null
          salt_100g?: number | null
          saturated_fat_100g?: number | null
          serving_size_g?: number | null
          source?: Database["public"]["Enums"]["product_source"]
          submitted_by_user_id?: string | null
          sugars_100g?: number | null
          traces_allergens?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          completed_at: string | null
          coupon_id: string | null
          created_at: string
          id: string
          referral_code: string
          referred_user_id: string | null
          referrer_reward_coupon_id: string | null
          referrer_user_id: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          coupon_id?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_user_id?: string | null
          referrer_reward_coupon_id?: string | null
          referrer_user_id: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          coupon_id?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_user_id?: string | null
          referrer_reward_coupon_id?: string | null
          referrer_user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_reward_coupon_id_fkey"
            columns: ["referrer_reward_coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_reward_coupon_id_fkey"
            columns: ["referrer_reward_coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons_public"
            referencedColumns: ["id"]
          },
        ]
      }
      rejected_forever_products: {
        Row: {
          barcode: string
          id: string
          name: string | null
          rejected_at: string
          rejected_by_admin_id: string | null
          rejection_reason: string | null
        }
        Insert: {
          barcode: string
          id?: string
          name?: string | null
          rejected_at?: string
          rejected_by_admin_id?: string | null
          rejection_reason?: string | null
        }
        Update: {
          barcode?: string
          id?: string
          name?: string | null
          rejected_at?: string
          rejected_by_admin_id?: string | null
          rejection_reason?: string | null
        }
        Relationships: []
      }
      scanner_config_steps: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          qr_payload: string
          sort_order: number
          step_name: string
          step_number: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          qr_payload: string
          sort_order?: number
          step_name: string
          step_number: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          qr_payload?: string
          sort_order?: number
          step_name?: string
          step_number?: number
        }
        Relationships: []
      }
      scanner_orders: {
        Row: {
          address1: string | null
          address2: string | null
          city: string | null
          country: string | null
          created_at: string
          currency: string
          full_name: string | null
          household_id: string | null
          id: string
          phone: string | null
          postal_code: string | null
          quantity: number
          scanner_color: string | null
          status: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          total: number
          tracking_number: string | null
          unit_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address1?: string | null
          address2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          full_name?: string | null
          household_id?: string | null
          id?: string
          phone?: string | null
          postal_code?: string | null
          quantity?: number
          scanner_color?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total: number
          tracking_number?: string | null
          unit_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address1?: string | null
          address2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          full_name?: string | null
          household_id?: string | null
          id?: string
          phone?: string | null
          postal_code?: string | null
          quantity?: number
          scanner_color?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total?: number
          tracking_number?: string | null
          unit_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scanner_orders_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      scanner_rate_limits: {
        Row: {
          created_at: string
          id: string
          request_count: number
          scanner_token_hash: string
          window_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          request_count?: number
          scanner_token_hash: string
          window_start?: string
        }
        Update: {
          created_at?: string
          id?: string
          request_count?: number
          scanner_token_hash?: string
          window_start?: string
        }
        Relationships: []
      }
      scanners: {
        Row: {
          created_at: string
          household_id: string
          id: string
          last_seen_at: string | null
          location: string | null
          name: string
          token: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          last_seen_at?: string | null
          location?: string | null
          name: string
          token?: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          last_seen_at?: string | null
          location?: string | null
          name?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "scanners_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          is_default: boolean
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          is_default?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          is_default?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      shopping_list: {
        Row: {
          added_automatically: boolean
          added_by: string | null
          bought_quantity: number
          created_at: string
          custom_image_url: string | null
          custom_text: string | null
          household_id: string
          id: string
          is_checked: boolean
          item_note: string | null
          needed_quantity: number
          product_id: string | null
          user_product_id: string | null
        }
        Insert: {
          added_automatically?: boolean
          added_by?: string | null
          bought_quantity?: number
          created_at?: string
          custom_image_url?: string | null
          custom_text?: string | null
          household_id: string
          id?: string
          is_checked?: boolean
          item_note?: string | null
          needed_quantity?: number
          product_id?: string | null
          user_product_id?: string | null
        }
        Update: {
          added_automatically?: boolean
          added_by?: string | null
          bought_quantity?: number
          created_at?: string
          custom_image_url?: string | null
          custom_text?: string | null
          household_id?: string
          id?: string
          is_checked?: boolean
          item_note?: string | null
          needed_quantity?: number
          product_id?: string | null
          user_product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_user_product_id_fkey"
            columns: ["user_product_id"]
            isOneToOne: false
            referencedRelation: "user_products"
            referencedColumns: ["id"]
          },
        ]
      }
      social_links: {
        Row: {
          display_name: string | null
          icon_name: string | null
          id: string
          is_active: boolean
          platform: string
          sort_order: number
          updated_at: string
          updated_by: string | null
          url: string | null
        }
        Insert: {
          display_name?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean
          platform: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          url?: string | null
        }
        Update: {
          display_name?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean
          platform?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          url?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_period: string | null
          cancel_at_period_end: boolean
          coupon_code: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          user_id: string
        }
        Insert: {
          billing_period?: string | null
          cancel_at_period_end?: boolean
          coupon_code?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          user_id: string
        }
        Update: {
          billing_period?: string | null
          cancel_at_period_end?: boolean
          coupon_code?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_health_profile: {
        Row: {
          allergens_to_avoid: string[]
          calorie_goal_per_day: number | null
          created_at: string
          diet_mode: string | null
          halal_only: boolean
          has_heart_condition: boolean
          id: string
          is_celiac: boolean
          is_diabetic: boolean
          is_lactose_intolerant: boolean
          updated_at: string
          user_id: string
          vegan: boolean
          vegetarian: boolean
        }
        Insert: {
          allergens_to_avoid?: string[]
          calorie_goal_per_day?: number | null
          created_at?: string
          diet_mode?: string | null
          halal_only?: boolean
          has_heart_condition?: boolean
          id?: string
          is_celiac?: boolean
          is_diabetic?: boolean
          is_lactose_intolerant?: boolean
          updated_at?: string
          user_id: string
          vegan?: boolean
          vegetarian?: boolean
        }
        Update: {
          allergens_to_avoid?: string[]
          calorie_goal_per_day?: number | null
          created_at?: string
          diet_mode?: string | null
          halal_only?: boolean
          has_heart_condition?: boolean
          id?: string
          is_celiac?: boolean
          is_diabetic?: boolean
          is_lactose_intolerant?: boolean
          updated_at?: string
          user_id?: string
          vegan?: boolean
          vegetarian?: boolean
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          language: Database["public"]["Enums"]["language_code"]
          notifications_enabled: boolean
          push_subscription_json: string | null
          show_allergens: boolean
          show_available_stores: boolean
          show_calories: boolean
          show_ecoscore: boolean
          show_halal_check: boolean
          show_health_warnings: boolean
          show_ingredients: boolean
          show_nova_group: boolean
          show_nutriscore: boolean
          show_nutrition_table: boolean
          theme: Database["public"]["Enums"]["theme_mode"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          language?: Database["public"]["Enums"]["language_code"]
          notifications_enabled?: boolean
          push_subscription_json?: string | null
          show_allergens?: boolean
          show_available_stores?: boolean
          show_calories?: boolean
          show_ecoscore?: boolean
          show_halal_check?: boolean
          show_health_warnings?: boolean
          show_ingredients?: boolean
          show_nova_group?: boolean
          show_nutriscore?: boolean
          show_nutrition_table?: boolean
          theme?: Database["public"]["Enums"]["theme_mode"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: Database["public"]["Enums"]["language_code"]
          notifications_enabled?: boolean
          push_subscription_json?: string | null
          show_allergens?: boolean
          show_available_stores?: boolean
          show_calories?: boolean
          show_ecoscore?: boolean
          show_halal_check?: boolean
          show_health_warnings?: boolean
          show_ingredients?: boolean
          show_nova_group?: boolean
          show_nutriscore?: boolean
          show_nutrition_table?: boolean
          theme?: Database["public"]["Enums"]["theme_mode"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_prices: {
        Row: {
          created_at: string
          currency: string | null
          household_id: string | null
          id: string
          location_city: string | null
          location_country: string | null
          paid_at: string | null
          price: number | null
          product_id: string | null
          supermarket: string | null
          user_id: string
          user_product_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          household_id?: string | null
          id?: string
          location_city?: string | null
          location_country?: string | null
          paid_at?: string | null
          price?: number | null
          product_id?: string | null
          supermarket?: string | null
          user_id: string
          user_product_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          household_id?: string | null
          id?: string
          location_city?: string | null
          location_country?: string | null
          paid_at?: string | null
          price?: number | null
          product_id?: string | null
          supermarket?: string | null
          user_id?: string
          user_product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_prices_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_prices_user_product_id_fkey"
            columns: ["user_product_id"]
            isOneToOne: false
            referencedRelation: "user_products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_products: {
        Row: {
          admin_note: string | null
          allergens: string[] | null
          barcode: string | null
          brand: string | null
          calories_100g: number | null
          category: string | null
          created_at: string
          currency: string | null
          ecoscore: Database["public"]["Enums"]["ecoscore_grade"] | null
          expiry_date: string | null
          fat_100g: number | null
          food_group: string | null
          generic_name: string | null
          halal_certified: boolean | null
          id: string
          image_url: string | null
          ingredients_text: string | null
          is_gluten_free: boolean | null
          is_vegan: boolean | null
          is_vegetarian: boolean | null
          keywords: string[] | null
          name: string
          name_ar: string | null
          name_de: string | null
          name_en: string | null
          name_fr: string | null
          nova_group: number | null
          nutriscore: Database["public"]["Enums"]["nutriscore_grade"] | null
          price: number | null
          proteins_100g: number | null
          quantity_unit: string | null
          quantity_value: number | null
          salt_100g: number | null
          status_seen_at: string | null
          submission_status: Database["public"]["Enums"]["user_product_status"]
          sugars_100g: number | null
          supermarket: string | null
          updated_at: string
          user_id: string
          user_photo_url: string | null
        }
        Insert: {
          admin_note?: string | null
          allergens?: string[] | null
          barcode?: string | null
          brand?: string | null
          calories_100g?: number | null
          category?: string | null
          created_at?: string
          currency?: string | null
          ecoscore?: Database["public"]["Enums"]["ecoscore_grade"] | null
          expiry_date?: string | null
          fat_100g?: number | null
          food_group?: string | null
          generic_name?: string | null
          halal_certified?: boolean | null
          id?: string
          image_url?: string | null
          ingredients_text?: string | null
          is_gluten_free?: boolean | null
          is_vegan?: boolean | null
          is_vegetarian?: boolean | null
          keywords?: string[] | null
          name: string
          name_ar?: string | null
          name_de?: string | null
          name_en?: string | null
          name_fr?: string | null
          nova_group?: number | null
          nutriscore?: Database["public"]["Enums"]["nutriscore_grade"] | null
          price?: number | null
          proteins_100g?: number | null
          quantity_unit?: string | null
          quantity_value?: number | null
          salt_100g?: number | null
          status_seen_at?: string | null
          submission_status?: Database["public"]["Enums"]["user_product_status"]
          sugars_100g?: number | null
          supermarket?: string | null
          updated_at?: string
          user_id: string
          user_photo_url?: string | null
        }
        Update: {
          admin_note?: string | null
          allergens?: string[] | null
          barcode?: string | null
          brand?: string | null
          calories_100g?: number | null
          category?: string | null
          created_at?: string
          currency?: string | null
          ecoscore?: Database["public"]["Enums"]["ecoscore_grade"] | null
          expiry_date?: string | null
          fat_100g?: number | null
          food_group?: string | null
          generic_name?: string | null
          halal_certified?: boolean | null
          id?: string
          image_url?: string | null
          ingredients_text?: string | null
          is_gluten_free?: boolean | null
          is_vegan?: boolean | null
          is_vegetarian?: boolean | null
          keywords?: string[] | null
          name?: string
          name_ar?: string | null
          name_de?: string | null
          name_en?: string | null
          name_fr?: string | null
          nova_group?: number | null
          nutriscore?: Database["public"]["Enums"]["nutriscore_grade"] | null
          price?: number | null
          proteins_100g?: number | null
          quantity_unit?: string | null
          quantity_value?: number | null
          salt_100g?: number | null
          status_seen_at?: string | null
          submission_status?: Database["public"]["Enums"]["user_product_status"]
          sugars_100g?: number | null
          supermarket?: string | null
          updated_at?: string
          user_id?: string
          user_photo_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      coupons_public: {
        Row: {
          amount_off: number | null
          code: string | null
          expires_at: string | null
          free_days: number | null
          id: string | null
          percent_off: number | null
          plan_id: string | null
          popup_message: string | null
          popup_title: string | null
          show_as_popup: boolean | null
          type: string | null
        }
        Insert: {
          amount_off?: number | null
          code?: string | null
          expires_at?: string | null
          free_days?: number | null
          id?: string | null
          percent_off?: number | null
          plan_id?: string | null
          popup_message?: string | null
          popup_title?: string | null
          show_as_popup?: boolean | null
          type?: string | null
        }
        Update: {
          amount_off?: number | null
          code?: string | null
          expires_at?: string | null
          free_days?: number | null
          id?: string | null
          percent_off?: number | null
          plan_id?: string | null
          popup_message?: string | null
          popup_title?: string | null
          show_as_popup?: boolean | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      offers_public: {
        Row: {
          clicks_count: number | null
          description: string | null
          discount_value: number | null
          ends_at: string | null
          id: string | null
          image_url: string | null
          max_clicks: number | null
          max_views: number | null
          offer_type: string | null
          product_group_id: string | null
          product_id: string | null
          section_id: string | null
          starts_at: string | null
          supermarket: string | null
          target_plans: string[] | null
          title: string | null
          views_count: number | null
        }
        Insert: {
          clicks_count?: number | null
          description?: string | null
          discount_value?: number | null
          ends_at?: string | null
          id?: string | null
          image_url?: string | null
          max_clicks?: number | null
          max_views?: number | null
          offer_type?: string | null
          product_group_id?: string | null
          product_id?: string | null
          section_id?: string | null
          starts_at?: string | null
          supermarket?: string | null
          target_plans?: string[] | null
          title?: string | null
          views_count?: number | null
        }
        Update: {
          clicks_count?: number | null
          description?: string | null
          discount_value?: number | null
          ends_at?: string | null
          id?: string | null
          image_url?: string | null
          max_clicks?: number | null
          max_views?: number | null
          offer_type?: string | null
          product_group_id?: string | null
          product_id?: string | null
          section_id?: string | null
          starts_at?: string | null
          supermarket?: string | null
          target_plans?: string[] | null
          title?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_product_group_id_fkey"
            columns: ["product_group_id"]
            isOneToOne: false
            referencedRelation: "product_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      popup_notifications_public: {
        Row: {
          coupon_id: string | null
          ends_at: string | null
          id: string | null
          is_active: boolean | null
          message: string | null
          referral_link_enabled: boolean | null
          starts_at: string | null
          target_plan: string | null
          title: string | null
          type: string | null
        }
        Insert: {
          coupon_id?: string | null
          ends_at?: string | null
          id?: string | null
          is_active?: boolean | null
          message?: string | null
          referral_link_enabled?: boolean | null
          starts_at?: string | null
          target_plan?: string | null
          title?: string | null
          type?: string | null
        }
        Update: {
          coupon_id?: string | null
          ends_at?: string | null
          id?: string | null
          is_active?: boolean | null
          message?: string | null
          referral_link_enabled?: boolean | null
          starts_at?: string | null
          target_plan?: string | null
          title?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "popup_notifications_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "popup_notifications_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_invite: { Args: { _token: string }; Returns: string }
      can_see_profile: { Args: { _target: string }; Returns: boolean }
      cancel_own_order: { Args: { _order_id: string }; Returns: undefined }
      create_household: { Args: { _name: string }; Returns: string }
      delete_my_account: { Args: never; Returns: undefined }
      get_admin_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["admin_role"]
      }
      get_scanner_token: { Args: { _scanner_id: string }; Returns: string }
      has_admin_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_household_admin: {
        Args: { _household_id: string; _user_id: string }
        Returns: boolean
      }
      is_household_member: {
        Args: { _household_id: string; _user_id: string }
        Returns: boolean
      }
      is_household_owner: {
        Args: { _household_id: string; _user_id: string }
        Returns: boolean
      }
      request_data_export: { Args: { _user_id: string }; Returns: string }
    }
    Enums: {
      admin_role: "super_admin" | "moderator" | "support"
      ecoscore_grade: "A" | "B" | "C" | "D" | "E"
      inventory_unit:
        | "pieces"
        | "liters"
        | "grams"
        | "kg"
        | "ml"
        | "cartons"
        | "bottles"
      language_code: "en" | "ar" | "de"
      nutriscore_grade: "A" | "B" | "C" | "D" | "E"
      order_status:
        | "pending"
        | "paid"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
      product_source: "openfoodfacts" | "user" | "admin_approved"
      subscription_status: "active" | "past_due" | "cancelled" | "trialing"
      theme_mode: "light" | "dark" | "system"
      user_product_status:
        | "local_only"
        | "pending_approval"
        | "approved"
        | "declined"
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
      admin_role: ["super_admin", "moderator", "support"],
      ecoscore_grade: ["A", "B", "C", "D", "E"],
      inventory_unit: [
        "pieces",
        "liters",
        "grams",
        "kg",
        "ml",
        "cartons",
        "bottles",
      ],
      language_code: ["en", "ar", "de"],
      nutriscore_grade: ["A", "B", "C", "D", "E"],
      order_status: [
        "pending",
        "paid",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      product_source: ["openfoodfacts", "user", "admin_approved"],
      subscription_status: ["active", "past_due", "cancelled", "trialing"],
      theme_mode: ["light", "dark", "system"],
      user_product_status: [
        "local_only",
        "pending_approval",
        "approved",
        "declined",
      ],
    },
  },
} as const
