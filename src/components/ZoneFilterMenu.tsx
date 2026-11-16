import { useState } from "react";
import { Menu, ChevronLeft, Trees } from "lucide-react";
import {
  FiltroZona,
  ZONAS_GEOGRAFICAS,
  ZONA_COLORES,
} from "@/types/reserva";

interface ZoneFilterMenuProps {
  activeZona: FiltroZona;
  onZonaChange: (zona: FiltroZona) => void;
}

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
          className="flex items-center gap-2.5 min-h-[42px] px-3.5 py-2 rounded-xl bg-card/95 backdrop-blur-md border border-border shadow-md text-foreground text-xs font-semibold hover:bg-muted/70 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title="Abrir filtro de zona geográfica"
          aria-expanded={false}
        >
          <Menu className="w-4 h-4 text-primary shrink-0" />
          <span className="font-display text-sm font-bold tracking-tight">Radar Verde</span>
          <span aria-hidden="true" className="text-muted-foreground">·</span>
          <span className="text-xs font-medium text-muted-foreground">
            {activeZona === "Todas" ? "Todas" : activeZona}
          </span>
        </button>
      </div>
    );
  }

  return (
    <aside
      className="absolute top-[68px] sm:top-3 left-3 z-[1000] w-[240px] bg-card/95 backdrop-blur-md p-3.5 rounded-2xl shadow-lg border border-border max-h-[82vh] overflow-y-auto custom-scrollbar"
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      aria-label="Filtro por zona geográfica"
    >
      <div className="flex items-center justify-between border-b border-border pb-2.5 mb-3">
        <div className="flex items-center gap-2 select-none">
          <Trees className="w-4 h-4 text-primary shrink-0" />
          <span className="font-display text-sm font-bold text-foreground tracking-tight whitespace-nowrap">
            Radar Verde
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          title="Contraer menú"
          aria-label="Contraer menú"
          className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
        Zona geográfica
      </p>

      <div className="space-y-1" role="radiogroup" aria-label="Zona geográfica">
        <button
          type="button"
          role="radio"
          aria-checked={activeZona === "Todas"}
          onClick={() => onZonaChange("Todas")}
          className={`flex items-center w-full gap-2.5 min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            activeZona === "Todas"
              ? "bg-primary text-primary-foreground font-semibold"
              : "text-foreground hover:bg-muted/70"
          }`}
        >
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 border border-current/30"
            style={{
              backgroundColor: activeZona === "Todas" ? "currentColor" : "transparent",
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
              className={`flex items-center w-full gap-2.5 min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isActive
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-foreground hover:bg-muted/70"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor: isActive ? "#FDFCF8" : color,
                }}
              />
              <span className="flex-1 text-left truncate">{zona}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default ZoneFilterMenu;
