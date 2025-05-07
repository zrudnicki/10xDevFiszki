export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      card_sets: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          topic: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          topic: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          topic?: string
          created_at?: string
          updated_at?: string
        }
      }
      flash_cards: {
        Row: {
          id: string
          card_set_id: string
          question: string
          answer: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          card_set_id: string
          question: string
          answer: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          card_set_id?: string
          question?: string
          answer?: string
          created_at?: string
          updated_at?: string
        }
      }
      spaced_repetition: {
        Row: {
          id: string
          user_id: string
          flash_card_id: string
          ease_factor: number
          interval: number
          repetitions: number
          due_date: string
          last_reviewed: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          flash_card_id: string
          ease_factor?: number
          interval?: number
          repetitions?: number
          due_date?: string
          last_reviewed?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          flash_card_id?: string
          ease_factor?: number
          interval?: number
          repetitions?: number
          due_date?: string
          last_reviewed?: string
          created_at?: string
          updated_at?: string
        }
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          card_set_id: string
          started_at: string
          ended_at: string | null
          cards_studied: number
        }
        Insert: {
          id?: string
          user_id: string
          card_set_id: string
          started_at?: string
          ended_at?: string | null
          cards_studied?: number
        }
        Update: {
          id?: string
          user_id?: string
          card_set_id?: string
          started_at?: string
          ended_at?: string | null
          cards_studied?: number
        }
      }
      session_cards: {
        Row: {
          id: string
          session_id: string
          flash_card_id: string
          rating: number | null
          time_spent: number | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          flash_card_id: string
          rating?: number | null
          time_spent?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          flash_card_id?: string
          rating?: number | null
          time_spent?: number | null
          created_at?: string
        }
      }
    }
  }
}
