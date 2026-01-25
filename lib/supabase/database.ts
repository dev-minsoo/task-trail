export type Database = {
  public: {
    Tables: {
      statuses: {
        Row: {
          id: string;
          name: string;
          order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          order: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          status_id: string;
          date: string;
          order: number;
          started_at: string | null;
          completed_at: string | null;
          is_archived: boolean;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          status_id: string;
          date: string;
          order: number;
          started_at?: string | null;
          completed_at?: string | null;
          is_archived?: boolean;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          status_id?: string;
          date?: string;
          order?: number;
          started_at?: string | null;
          completed_at?: string | null;
          is_archived?: boolean;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      task_status_history: {
        Row: {
          id: string;
          task_id: string;
          from_status_id: string | null;
          to_status_id: string;
          changed_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          from_status_id?: string | null;
          to_status_id: string;
          changed_at?: string;
        };
        Update: {
          task_id?: string;
          from_status_id?: string | null;
          to_status_id?: string;
          changed_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
