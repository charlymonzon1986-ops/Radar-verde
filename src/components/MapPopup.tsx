import { Camera, Navigation } from "lucide-react";
import { buildGoogleMapsUrl, Reserva, ZONA_COLORES } from "@/types/reserva";

interface MapPopupProps {
  reserva: Reserva;
  onOpenGallery: (reserva: Reserva) => void;
}

const MapPopup = ({ reserva, onOpenGallery }: MapPopupProps) => {
  const mapsUrl = buildGoogleMapsUrl(reserva);
  const zonaColor = ZONA_COLORES[reserva.zona];
  const [lat, lng] = reserva.coordenadas;

  return (
    <div className="p-4 w-[272px] sm:w-[296px] max-w-[85vw] bg-card text-card-foreground">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: zonaColor }}
          aria-hidden="true"
        />
        <span>Zona {reserva.zona}</span>
        <span aria-hidden="true">·</span>
        <span className="tabular-nums">
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </span>
      </div>

      <h3 className="font-display text-lg font-bold text-foreground leading-snug mb-2 pr-5">
        {reserva.nombre}
      </h3>

      {reserva.descripcion && (
        <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed mb-4 line-clamp-4">
          {reserva.descripcion}
        </p>
      )}

      <div className="flex flex-col gap-2 w-full">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 min-h-[40px] py-2 px-4 rounded-xl text-xs sm:text-sm font-semibold text-primary-foreground bg-primary hover:opacity-95 transition-opacity whitespace-nowrap shrink-0 no-underline"
        >
          <Navigation className="w-4 h-4 shrink-0" />
          <span>Cómo llegar</span>
        </a>

        <button
          type="button"
          onClick={() => onOpenGallery(reserva)}
          className="w-full inline-flex items-center justify-center gap-2 min-h-[40px] py-2 px-4 rounded-xl text-xs sm:text-sm font-semibold text-secondary-foreground bg-secondary hover:opacity-95 transition-opacity cursor-pointer whitespace-nowrap shrink-0"
        >
          <Camera className="w-4 h-4 shrink-0" />
          <span>
            {reserva.fotos.length > 0
              ? `Ver / Subir fotos (${reserva.fotos.length})`
              : "Ver / Subir fotos"}
          </span>
        </button>
      </div>
    </div>
  );
};

export default MapPopup;
