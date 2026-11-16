export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// TODO: conectar a Supabase nuevo — regenerar tipos con `supabase gen types typescript` cuando el nuevo proyecto esté creado.
export interface Database {
  public: {
    Tables: {
      reservas: {
        Row: {
          id: string;
          nombre: string;
          zona: string;
          descripcion: string;
          coordenadas: number[];
          google_maps_url: string;
          fotos: Json | null;
          created_at?: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          zona: string;
          descripcion: string;
          coordenadas: number[];
          google_maps_url: string;
          fotos?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          zona?: string;
          descripcion?: string;
          coordenadas?: number[];
          google_maps_url?: string;
          fotos?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      fotos: {
        Row: {
          id: string;
          reserva_id: string;
          url: string;
          autor: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reserva_id: string;
          url: string;
          autor?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          reserva_id?: string;
          url?: string;
          autor?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fotos_reserva_id_fkey";
            columns: ["reserva_id"];
            isOneToOne: false;
            referencedRelation: "reservas";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
