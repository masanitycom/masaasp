export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          user_increment_id: number | null
          user_id: string
          password: string | null
          password_hash: string | null
          lender_no: number | null
          mail_address: string | null
          kanji_last_name: string | null
          kanji_first_name: string | null
          furi_last_name: string | null
          furi_first_name: string | null
          fixed_line_phone: string | null
          status_flg: number
          system_access_flg: boolean
          admin_flg: boolean
          make_time: string
          make_user: string | null
          update_time: string
          update_user: string | null
        }
        Insert: {
          id?: string
          user_increment_id?: number | null
          user_id: string
          password?: string | null
          password_hash?: string | null
          lender_no?: number | null
          mail_address?: string | null
          kanji_last_name?: string | null
          kanji_first_name?: string | null
          furi_last_name?: string | null
          furi_first_name?: string | null
          fixed_line_phone?: string | null
          status_flg?: number
          system_access_flg?: boolean
          admin_flg?: boolean
          make_time?: string
          make_user?: string | null
          update_time?: string
          update_user?: string | null
        }
        Update: {
          id?: string
          user_increment_id?: number | null
          user_id?: string
          password?: string | null
          password_hash?: string | null
          lender_no?: number | null
          mail_address?: string | null
          kanji_last_name?: string | null
          kanji_first_name?: string | null
          furi_last_name?: string | null
          furi_first_name?: string | null
          fixed_line_phone?: string | null
          status_flg?: number
          system_access_flg?: boolean
          admin_flg?: boolean
          make_time?: string
          make_user?: string | null
          update_time?: string
          update_user?: string | null
        }
      }
      camel_levels: {
        Row: {
          id: string
          camel_level_id: number | null
          user_id: string | null
          int_id_camel: string | null
          level: number | null
          name: string | null
          furi_name: string | null
          pos: number | null
          upline: string | null
          depth_level: number | null
          path: string[] | null
          direct_children_count: number
          total_children_count: number
          status_flg: number
          make_time: string
          make_user: string | null
          update_time: string
          update_user: string | null
        }
        Insert: {
          id?: string
          camel_level_id?: number | null
          user_id?: string | null
          int_id_camel?: string | null
          level?: number | null
          name?: string | null
          furi_name?: string | null
          pos?: number | null
          upline?: string | null
          depth_level?: number | null
          path?: string[] | null
          direct_children_count?: number
          total_children_count?: number
          status_flg?: number
          make_time?: string
          make_user?: string | null
          update_time?: string
          update_user?: string | null
        }
        Update: {
          id?: string
          camel_level_id?: number | null
          user_id?: string | null
          int_id_camel?: string | null
          level?: number | null
          name?: string | null
          furi_name?: string | null
          pos?: number | null
          upline?: string | null
          depth_level?: number | null
          path?: string[] | null
          direct_children_count?: number
          total_children_count?: number
          status_flg?: number
          make_time?: string
          make_user?: string | null
          update_time?: string
          update_user?: string | null
        }
      }
      investment_history: {
        Row: {
          id: string
          no: number | null
          payment_date: string | null
          user_id: string | null
          user_name: string | null
          amount: number
          fund_no: number | null
          fund_name: string | null
          fund_type: string | null
          commission_rate: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          no?: number | null
          payment_date?: string | null
          user_id?: string | null
          user_name?: string | null
          amount: number
          fund_no?: number | null
          fund_name?: string | null
          fund_type?: string | null
          commission_rate?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          no?: number | null
          payment_date?: string | null
          user_id?: string | null
          user_name?: string | null
          amount?: number
          fund_no?: number | null
          fund_name?: string | null
          fund_type?: string | null
          commission_rate?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      fund_settings: {
        Row: {
          id: string
          fund_no: number | null
          fund_name: string
          fund_type: string
          reward_structure: Json
          max_tier: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          fund_no?: number | null
          fund_name: string
          fund_type: string
          reward_structure: Json
          max_tier?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          fund_no?: number | null
          fund_name?: string
          fund_type?: string
          reward_structure?: Json
          max_tier?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      reward_rules: {
        Row: {
          id: string
          rule_name: string
          reward_structure: Json
          max_tier: number
          description: string | null
          is_template: boolean
          created_at: string
        }
        Insert: {
          id?: string
          rule_name: string
          reward_structure: Json
          max_tier: number
          description?: string | null
          is_template?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          rule_name?: string
          reward_structure?: Json
          max_tier?: number
          description?: string | null
          is_template?: boolean
          created_at?: string
        }
      }
      calculated_rewards: {
        Row: {
          id: string
          user_id: string | null
          referral_user_id: string | null
          investment_id: string | null
          tier_level: number | null
          reward_amount: number
          fund_no: number | null
          calculation_date: string
          is_paid: boolean
        }
        Insert: {
          id?: string
          user_id?: string | null
          referral_user_id?: string | null
          investment_id?: string | null
          tier_level?: number | null
          reward_amount: number
          fund_no?: number | null
          calculation_date?: string
          is_paid?: boolean
        }
        Update: {
          id?: string
          user_id?: string | null
          referral_user_id?: string | null
          investment_id?: string | null
          tier_level?: number | null
          reward_amount?: number
          fund_no?: number | null
          calculation_date?: string
          is_paid?: boolean
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
  }
}

export type User = Database['public']['Tables']['users']['Row']
export type CamelLevel = Database['public']['Tables']['camel_levels']['Row']
export type InvestmentHistory = Database['public']['Tables']['investment_history']['Row']
export type FundSettings = Database['public']['Tables']['fund_settings']['Row']
export type RewardRules = Database['public']['Tables']['reward_rules']['Row']
export type CalculatedRewards = Database['public']['Tables']['calculated_rewards']['Row']

export interface RewardStructure {
  tier1?: number
  tier2?: number
  tier3?: number
  tier4?: number
  tier5?: number
  [key: string]: number | undefined
}