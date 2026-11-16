export type ZonaGeografica = "Norte" | "Sur" | "Este" | "Oeste" | "Centro";

export type FiltroZona = "Todas" | ZonaGeografica;

export const ZONAS_GEOGRAFICAS: readonly ZonaGeografica[] = [
  "Norte",
  "Sur",
  "Este",
  "Oeste",
  "Centro",
] as const;

export const ZONA_COLORES: Record<ZonaGeografica, string> = {
  Norte: "#4a7c4a",
  Sur: "#6d9449",
  Este: "#8faa5b",
  Oeste: "#c8a96e",
  Centro: "#a87e41",
};

export interface ReservaFoto {
  id: string;
  url: string;
  autor?: string | null;
  created_at?: string;
}

export interface Reserva {
  id: string;
  nombre: string;
  zona: ZonaGeografica;
  descripcion: string;
  coordenadas: [number, number];
  google_maps_url: string;
  fotos: ReservaFoto[];
}

export function buildGoogleMapsUrl(
  reserva: Pick<Reserva, "google_maps_url" | "coordenadas" | "nombre">
): string {
  if (reserva.google_maps_url && reserva.google_maps_url.trim().length > 0) {
    return reserva.google_maps_url;
  }
  const [lat, lng] = reserva.coordenadas;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
