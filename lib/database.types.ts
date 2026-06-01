/** Supabase schema types — sync after migrations (#19). Regenerate with:
 *  npx supabase gen types typescript --project-id frhtkmpsfyyidqijuijp > lib/database.types.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      lessons: {
        Row: {
          id: number;
          book_id: number;
          book_num: number;
          stage: number;
          lesson_num: number;
          cefr_level: string | null;
          pdf_page_start: number | null;
          pdf_page_end: number | null;
          book_page_start: number | null;
          book_page_end: number | null;
          block_count: number;
          term_count: number;
          qa_count: number;
          embedding: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["lessons"]["Row"]> & {
          book_id: number;
          book_num: number;
          stage: number;
          lesson_num: number;
        };
        Update: Partial<Database["public"]["Tables"]["lessons"]["Row"]>;
      };
      scenes: {
        Row: {
          id: number;
          lesson_id: number | null;
          block_id: string | null;
          image_url: string;
          title: string | null;
          description: string | null;
          image_prompt: string | null;
          image_type: "scene" | "action" | "concept" | null;
          image_model: string | null;
          position: number;
          hotspots: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["scenes"]["Row"]> & {
          image_url: string;
        };
        Update: Partial<Database["public"]["Tables"]["scenes"]["Row"]>;
      };
      terms: {
        Row: {
          id: number;
          block_id: string;
          book_id: number;
          lesson_id: number | null;
          book_page_id: number | null;
          term: string;
          normalized: string;
          term_type: string;
          book_num: number;
          stage: number;
          lesson_num: number | null;
          pdf_page: number;
          book_page: number | null;
          position: number | null;
          qa_pair_id: number | null;
          metadata: Json;
          cluster_name: string | null;
          definition: string | null;
          phonetic: string | null;
          term_kind: string | null;
          embedding: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["terms"]["Row"]> & {
          block_id: string;
          book_id: number;
          term: string;
          normalized: string;
          book_num: number;
          stage: number;
          pdf_page: number;
        };
        Update: Partial<Database["public"]["Tables"]["terms"]["Row"]>;
      };
      qa_pairs: {
        Row: {
          id: number;
          block_id: string;
          book_id: number;
          lesson_id: number | null;
          book_page_id: number | null;
          book_num: number;
          stage: number;
          lesson_num: number | null;
          pdf_page: number;
          book_page: number | null;
          pair_index: number;
          question: string;
          answer: string | null;
          qa_type: string;
          qa_category: "lesson" | "review";
          audio_url: string | null;
          metadata: Json;
          question_embedding: string | null;
          answer_embedding: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["qa_pairs"]["Row"]> & {
          block_id: string;
          book_id: number;
          pair_index: number;
          question: string;
          book_num: number;
          stage: number;
          pdf_page: number;
        };
        Update: Partial<Database["public"]["Tables"]["qa_pairs"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
