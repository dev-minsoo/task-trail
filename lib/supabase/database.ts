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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          status_id: string;
          date: string;
          order: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          status_id?: string;
          date?: string;
          order?: number;
          created_at?: string;
          updated_at?: string;
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
