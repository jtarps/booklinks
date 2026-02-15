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
      books: {
        Row: {
          id: string
          slug: string
          title: string
          author: string
          description: string | null
          cover_url: string | null
          references_discovered: boolean
          references_discovered_at: string | null
          added_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          author: string
          description?: string | null
          cover_url?: string | null
          references_discovered?: boolean
          references_discovered_at?: string | null
          added_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          author?: string
          description?: string | null
          cover_url?: string | null
          references_discovered?: boolean
          references_discovered_at?: string | null
          added_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      book_references: {
        Row: {
          id: string
          source_book_id: string
          referenced_book_id: string
          context: string | null
          page_number: number | null
          source: string
          source_url: string | null
          source_verified: boolean
          verification_date: string | null
          added_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          source_book_id: string
          referenced_book_id: string
          context?: string | null
          page_number?: number | null
          source?: string
          source_url?: string | null
          source_verified?: boolean
          verification_date?: string | null
          added_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          source_book_id?: string
          referenced_book_id?: string
          context?: string | null
          page_number?: number | null
          source?: string
          source_url?: string | null
          source_verified?: boolean
          verification_date?: string | null
          added_by?: string | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reading_lists: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          is_public: boolean
          slug: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          is_public?: boolean
          slug: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          is_public?: boolean
          slug?: string
          created_at?: string
          updated_at?: string
        }
      }
      reading_list_items: {
        Row: {
          id: string
          reading_list_id: string
          book_id: string
          position: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reading_list_id: string
          book_id: string
          position?: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          reading_list_id?: string
          book_id?: string
          position?: number
          notes?: string | null
          created_at?: string
        }
      }
      reference_upvotes: {
        Row: {
          id: string
          user_id: string
          reference_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          reference_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          reference_id?: string
          created_at?: string
        }
      }
      reference_comments: {
        Row: {
          id: string
          user_id: string
          reference_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          reference_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          reference_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
