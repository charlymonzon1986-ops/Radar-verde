import { useRef, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, ImageOff, MapPin } from "lucide-react";
import { buildGoogleMapsUrl, Reserva } from "@/types/reserva";

interface MapPopupProps {
  reserva: Reserva;
  onOpenGallery: (reserva: Reserva) => void;
}

const MapPopup = ({ reserva, onOpenGallery }: MapPopupProps) => {
  const mapsUrl = buildGoogleMapsUrl(reserva);
  const fotos = reserva.fotos ?? [];
  const [activeSlide, setActiveSlide] = useState(0);
  const [brokenIds, setBrokenIds] = useState<Set<string>>(new Set());
  const carouselRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const el = carouselRef.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveSlide(Math.max(0, Math.min(index, fotos.length - 1)));
  };

  const scrollToSlide = (index: number) => {
    const el = carouselRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(index, fotos.length - 1));
    el.scrollTo({
      left: clamped * el.clientWidth,
      behavior: "smooth",
    });
    setActiveSlide(clamped);
  };

  return (
    <div
      className="w-[290px] sm:w-[320px] max-w-[85vw] bg-[#faf7f2] text-[#3d2b1f]"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* 1. Nombre de la reserva (título) */}
      <div className="px-4 pt-4 pb-3 pr-10">
        <h3 className="font-display text-[22px] font-bold text-[#2d4a2d] leading-tight">
          {reserva.nombre}
        </h3>
      </div>

      {/* 2. Galería de fotos (carousel horizontal 160px) */}
      <div className="w-full">
        {fotos.length === 0 ? (
          <div className="w-full h-[160px] bg-[#f5f0e8] border-y border-[#d8ccb8]/70 flex flex-col items-center justify-center gap-2 text-[#3d2b1f]/65">
            <Camera className="w-6 h-6 text-[#4a7c4a]" />
            <span className="text-xs font-medium">Sin fotos aún</span>
          </div>
        ) : (
          <div className="relative group w-full">
            <div
              ref={carouselRef}
              onScroll={handleScroll}
              className="w-full h-[160px] flex overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-[#f5f0e8]"
            >
              {fotos.map((foto, idx) => {
                const isBroken = brokenIds.has(foto.id);
                return (
                  <div
                    key={foto.id || idx}
                    className="w-full h-[160px] shrink-0 snap-center"
                  >
                    {isBroken ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-[#3d2b1f]/65 bg-[#f5f0e8]">
                        <ImageOff className="w-5 h-5" />
                        <span className="text-xs">Imagen no disponible</span>
                      </div>
                    ) : (
                      <img
                        src={foto.url}
                        alt={`${reserva.nombre} - foto ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setBrokenIds((prev) => new Set(prev).add(foto.id))
                        }
                        className="w-full h-full object-cover block"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {fotos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollToSlide(activeSlide - 1);
                  }}
                  disabled={activeSlide === 0}
                  aria-label="Foto anterior"
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#faf7f2]/90 text-[#2d4a2d] flex items-center justify-center opacity-0 group-hover:opacity-100 disabled:opacity-0 transition-opacity cursor-pointer border border-[#d8ccb8]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollToSlide(activeSlide + 1);
                  }}
                  disabled={activeSlide === fotos.length - 1}
                  aria-label="Siguiente foto"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#faf7f2]/90 text-[#2d4a2d] flex items-center justify-center opacity-0 group-hover:opacity-100 disabled:opacity-0 transition-opacity cursor-pointer border border-[#d8ccb8]"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Indicadores de posición (dots) */}
            <div
              className="flex items-center justify-center gap-1.5 py-2"
              role="tablist"
              aria-label="Fotos de la reserva"
            >
              {fotos.map((foto, idx) => {
                const isActive = idx === activeSlide;
                return (
                  <button
                    key={foto.id || idx}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Ir a foto ${idx + 1}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      scrollToSlide(idx);
                    }}
                    className={`rounded-full transition-all cursor-pointer ${
                      isActive
                        ? "w-2.5 h-2.5 bg-[#4a7c4a]"
                        : "w-2 h-2 bg-[#4a7c4a]/30 hover:bg-[#4a7c4a]/60"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Descripción breve del lugar */}
      <div className="px-4 pt-3 pb-3.5">
        <p className="text-[13px] text-[#3d2b1f] leading-relaxed line-clamp-3">
          {reserva.descripcion || "Reserva ecológica natural."}
        </p>
      </div>

      {/* 4 y 5. Botones de acción */}
      <div className="px-4 pb-4 flex flex-col gap-2 w-full">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 min-h-[40px] py-2.5 px-4 rounded-[8px] text-[13px] font-bold text-[#3d2b1f] bg-[#c8a96e] hover:bg-[#be9b59] transition-colors whitespace-nowrap shrink-0 no-underline"
        >
          <MapPin className="w-4 h-4 shrink-0" />
          <span>Cómo llegar</span>
        </a>

        <button
          type="button"
          onClick={() => onOpenGallery(reserva)}
          className="w-full inline-flex items-center justify-center gap-2 min-h-[40px] py-2.5 px-4 rounded-[8px] text-[13px] font-semibold text-[#faf7f2] bg-[#4a7c4a] hover:bg-[#3f6b3f] transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Camera className="w-4 h-4 shrink-0" />
          <span>Ver/Subir fotos</span>
        </button>
      </div>
    </div>
  );
};

export default MapPopup;
