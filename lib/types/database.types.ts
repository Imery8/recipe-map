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
      meal_plans: {
        Row: {
          id: string
          user_id: string
          recipe_id: string
          day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          week_start_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recipe_id: string
          day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          week_start_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recipe_id?: string
          day_of_week?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          week_start_date?: string
          created_at?: string
          updated_at?: string
        }
      }
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
