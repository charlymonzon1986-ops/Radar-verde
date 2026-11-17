import { useState } from "react";
import { ChevronLeft, Menu } from "lucide-react";
import {
  FiltroZona,
  ZONAS_GEOGRAFICAS,
  ZONA_COLORES,
} from "@/types/reserva";

interface ZoneFilterMenuProps {
  activeZona: FiltroZona;
  onZonaChange: (zona: FiltroZona) => void;
}

const ParkTreeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-5 h-5 shrink-0"
    aria-hidden="true"
  >
    <path
      d="M12 2.5L6.5 10.5H10L5.5 17H18.5L14 10.5H17.5L12 2.5Z"
      fill="#c8a96e"
      stroke="#faf7f2"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <path
      d="M12 17V21.5"
      stroke="#faf7f2"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const ZoneFilterMenu = ({ activeZona, onZonaChange }: ZoneFilterMenuProps) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 640;
    }
    return false;
  });

  if (isCollapsed) {
    return (
      <div
        className="absolute top-[68px] sm:top-3 left-3 z-[1000]"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-[#2d4a2d] border border-[#3d2b1f] shadow-md text-[#faf7f2] text-xs font-medium hover:bg-[#355635] transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a96e]"
          title="Abrir filtro de zona geográfica"
          aria-expanded={false}
        >
          <Menu className="w-4 h-4 text-[#c8a96e] shrink-0" />
          <ParkTreeIcon />
          <span className="font-display text-base font-bold uppercase tracking-wider text-[#faf7f2]">
            Radar Verde
          </span>
          <span aria-hidden="true" className="text-[#c8a96e]">·</span>
          <span className="text-xs font-semibold text-[#c8a96e]">
            {activeZona === "Todas" ? "Todas" : activeZona}
          </span>
        </button>
      </div>
    );
  }

  return (
    <aside
      className="absolute top-[68px] sm:top-3 left-3 z-[1000] w-[244px] bg-[#2d4a2d] text-[#faf7f2] p-3.5 rounded-2xl shadow-xl border border-[#3d2b1f] max-h-[82vh] overflow-y-auto custom-scrollbar"
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      aria-label="Filtro por zona geográfica"
    >
      <div className="flex items-center justify-between border-b border-[#c8a96e]/30 pb-3 mb-3">
        <div className="flex items-center gap-2 select-none">
          <ParkTreeIcon />
          <span className="font-display text-lg font-bold uppercase tracking-wider text-[#faf7f2] whitespace-nowrap">
            Radar Verde
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          title="Contraer menú"
          aria-label="Contraer menú"
          className="flex items-center justify-center w-8 h-8 rounded-lg text-[#c8a96e] hover:text-[#faf7f2] hover:bg-[#4a7c4a]/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a96e]"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs font-semibold text-[#c8a96e] mb-2 px-1">
        Zona geográfica
      </p>

      <div className="space-y-1" role="radiogroup" aria-label="Zona geográfica">
        <button
          type="button"
          role="radio"
          aria-checked={activeZona === "Todas"}
          onClick={() => onZonaChange("Todas")}
          className={`flex items-center w-full gap-2.5 min-h-[40px] px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a96e] ${
            activeZona === "Todas"
              ? "bg-[#4a7c4a] text-[#faf7f2] font-semibold"
              : "text-[#faf7f2] font-medium hover:bg-[#4a7c4a]/40"
          }`}
        >
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 border border-[#c8a96e]"
            style={{
              backgroundColor: activeZona === "Todas" ? "#c8a96e" : "transparent",
            }}
          />
          <span className="flex-1 text-left truncate">Todas</span>
        </button>

        {ZONAS_GEOGRAFICAS.map((zona) => {
          const isActive = activeZona === zona;
          const color = ZONA_COLORES[zona];
          return (
            <button
              key={zona}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onZonaChange(zona)}
              className={`flex items-center w-full gap-2.5 min-h-[40px] px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a96e] ${
                isActive
                  ? "bg-[#4a7c4a] text-[#faf7f2] font-semibold"
                  : "text-[#faf7f2] font-medium hover:bg-[#4a7c4a]/40"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 border border-[#faf7f2]/40"
                style={{ backgroundColor: color }}
              />
              <span className="flex-1 text-left truncate">{zona}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 pt-2 border-t border-[#faf7f2]/15 text-[10px] leading-snug text-[#c8a96e]">
        Mapa © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">OpenStreetMap</a> contributors
      </p>
    </aside>
  );
};

export default ZoneFilterMenu;
