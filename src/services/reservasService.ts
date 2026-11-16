import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import { Reserva, ReservaFoto, ZONAS_GEOGRAFICAS, ZonaGeografica } from "@/types/reserva";

type ReservaRow = Database["public"]["Tables"]["reservas"]["Row"];
type FotoRow = Database["public"]["Tables"]["fotos"]["Row"];

function isZonaGeografica(value: string): value is ZonaGeografica {
  return (ZONAS_GEOGRAFICAS as readonly string[]).includes(value);
}

function normalizeFotos(rawFotos: Json | null | undefined): ReservaFoto[] {
  if (!Array.isArray(rawFotos)) return [];
  return rawFotos
    .map((item, idx): ReservaFoto | null => {
      if (typeof item === "string" && item.trim().length > 0) {
        return { id: `foto-${idx}`, url: item };
      }
      if (item && typeof item === "object" && !Array.isArray(item) && "url" in item) {
        const record = item as Record<string, unknown>;
        if (typeof record.url === "string" && record.url.trim().length > 0) {
          return {
            id: typeof record.id === "string" ? record.id : `foto-${idx}`,
            url: record.url,
            autor: typeof record.autor === "string" ? record.autor : null,
            created_at: typeof record.created_at === "string" ? record.created_at : undefined,
          };
        }
      }
      return null;
    })
    .filter((foto): foto is ReservaFoto => foto !== null);
}

function normalizeReserva(row: ReservaRow): Reserva | null {
  if (!Array.isArray(row.coordenadas) || row.coordenadas.length < 2) {
    return null;
  }

  const lat = Number(row.coordenadas[0]);
  const lng = Number(row.coordenadas[1]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  const zona: ZonaGeografica = isZonaGeografica(row.zona) ? row.zona : "Centro";

  return {
    id: row.id,
    nombre: row.nombre,
    zona,
    descripcion: row.descripcion ?? "",
    coordenadas: [lat, lng],
    google_maps_url: row.google_maps_url ?? "",
    fotos: normalizeFotos(row.fotos),
  };
}

export interface FetchReservasResult {
  reservas: Reserva[];
  configured: boolean;
}

export async function fetchReservas(): Promise<FetchReservasResult> {
  if (!isSupabaseConfigured || !supabase) {
    // TODO: conectar a Supabase nuevo — cuando VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY estén configuradas, esta función cargará las reservas reales.
    return { reservas: [], configured: false };
  }

  // TODO: conectar a Supabase nuevo — verificar que la tabla "reservas" tenga las columnas id, nombre, zona, descripcion, coordenadas, google_maps_url y fotos.
  const { data, error } = await supabase
    .from("reservas")
    .select("id, nombre, zona, descripcion, coordenadas, google_maps_url, fotos")
    .order("nombre", { ascending: true });

  if (error) {
    throw error;
  }

  const reservas = (data ?? [])
    .map(normalizeReserva)
    .filter((item): item is Reserva => item !== null);

  return { reservas, configured: true };
}

export async function fetchFotosByReserva(
  reservaId: string,
  fallbackFotos: ReservaFoto[] = []
): Promise<ReservaFoto[]> {
  if (!isSupabaseConfigured || !supabase) {
    // TODO: conectar a Supabase nuevo — consultar tabla "fotos" filtrando por reserva_id.
    return fallbackFotos;
  }

  // TODO: conectar a Supabase nuevo — ajustar nombre de tabla o relación si las fotos viven embebidas en reservas.fotos[].
  const { data, error } = await supabase
    .from("fotos")
    .select("id, reserva_id, url, autor, created_at")
    .eq("reserva_id", reservaId)
    .order("created_at", { ascending: false });

  if (error) {
    return fallbackFotos;
  }

  const rows = (data ?? []) as FotoRow[];
  if (rows.length === 0 && fallbackFotos.length > 0) {
    return fallbackFotos;
  }

  return rows.map((row) => ({
    id: row.id,
    url: row.url,
    autor: row.autor,
    created_at: row.created_at,
  }));
}

export async function uploadReservaFoto(params: {
  reserva: Reserva;
  file: File;
  autor?: string;
}): Promise<ReservaFoto> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      "Supabase no está configurado. Completá VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY antes de subir fotos."
    );
  }

  const { reserva, file, autor } = params;
  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = `reservas/${reserva.id}/${fileName}`;

  // TODO: conectar a Supabase nuevo — asegurarse de que el bucket público "fotos" exista en Storage del nuevo proyecto.
  const { error: uploadError } = await supabase.storage
    .from("fotos")
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data: urlData } = supabase.storage.from("fotos").getPublicUrl(filePath);
  const publicUrl = urlData.publicUrl;
  const cleanAutor = autor?.trim() || "Anónimo";

  // TODO: conectar a Supabase nuevo — insertar registro en tabla "fotos" vinculado a reserva_id.
  const { data: inserted, error: insertError } = await supabase
    .from("fotos")
    .insert({
      reserva_id: reserva.id,
      url: publicUrl,
      autor: cleanAutor,
    })
    .select("id, url, autor, created_at")
    .single();

  if (insertError) {
    throw insertError;
  }

  return {
    id: inserted.id,
    url: inserted.url,
    autor: inserted.autor,
    created_at: inserted.created_at,
  };
}
