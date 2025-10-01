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
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string | null
          icon: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string | null
          icon?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string | null
          icon?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      recipes: {
        Row: {
          id: string
          user_id: string
          url: string
          title: string
          description: string | null
          thumbnail_url: string | null
          category_id: string | null
          prep_time: string | null
          difficulty: string | null
          cuisine_type: string | null
          dietary_tags: string[] | null
          notes: string | null
          rating: number | null
          is_favorite: boolean
          source_domain: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          url: string
          title: string
          description?: string | null
          thumbnail_url?: string | null
          category_id?: string | null
          prep_time?: string | null
          difficulty?: string | null
          cuisine_type?: string | null
          dietary_tags?: string[] | null
          notes?: string | null
          rating?: number | null
          is_favorite?: boolean
          source_domain?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          url?: string
          title?: string
          description?: string | null
          thumbnail_url?: string | null
          category_id?: string | null
          prep_time?: string | null
          difficulty?: string | null
          cuisine_type?: string | null
          dietary_tags?: string[] | null
          notes?: string | null
          rating?: number | null
          is_favorite?: boolean
          source_domain?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
