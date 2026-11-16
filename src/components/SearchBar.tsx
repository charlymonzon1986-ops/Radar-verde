import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Search, X } from "lucide-react";
import { Reserva, ZONA_COLORES } from "@/types/reserva";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  reservas: Reserva[];
  onSelectReserva: (reserva: Reserva) => void;
}

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  reservas,
  onSelectReserva,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalizedQuery = useMemo(() => normalize(searchQuery), [searchQuery]);

  const matchingReservas = useMemo(() => {
    if (!normalizedQuery) return [];
    return reservas.filter((reserva) => {
      const normName = normalize(reserva.nombre);
      const normZona = normalize(reserva.zona);
      const normDesc = normalize(reserva.descripcion);
      return (
        normName.includes(normalizedQuery) ||
        normZona.includes(normalizedQuery) ||
        normDesc.includes(normalizedQuery)
      );
    });
  }, [reservas, normalizedQuery]);

  const handleSelect = (reserva: Reserva) => {
    onSelectReserva(reserva);
    setIsFocused(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onSearchChange("");
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isFocused || matchingReservas.length === 0) {
      if (e.key === "Escape") {
        setIsFocused(false);
        inputRef.current?.blur();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < matchingReservas.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : matchingReservas.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target =
        selectedIndex >= 0 && selectedIndex < matchingReservas.length
          ? matchingReservas[selectedIndex]
          : matchingReservas[0];
      if (target) handleSelect(target);
    } else if (e.key === "Escape") {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    if (selectedIndex >= 0 && resultsListRef.current) {
      const activeEl = resultsListRef.current.children[selectedIndex] as HTMLElement | undefined;
      activeEl?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const showDropdown = isFocused && normalizedQuery.length > 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 min-h-[44px] px-3.5 rounded-2xl bg-card/95 backdrop-blur-md border border-border shadow-md focus-within:ring-2 focus-within:ring-ring transition-shadow">
        <Search className="w-4 h-4 text-primary shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            onSearchChange(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar reserva ecológica o zona..."
          aria-label="Buscar reserva ecológica"
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none py-2"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Limpiar búsqueda"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="mt-2 rounded-2xl bg-card/98 backdrop-blur-md border border-border shadow-xl overflow-hidden">
          <div
            ref={resultsListRef}
            className="overflow-y-auto max-h-[280px] divide-y divide-border/70 custom-scrollbar"
          >
            {matchingReservas.length > 0 ? (
              matchingReservas.map((reserva, idx) => {
                const isSelected = selectedIndex === idx;
                const zonaColor = ZONA_COLORES[reserva.zona];
                return (
                  <button
                    key={reserva.id}
                    type="button"
                    onClick={() => handleSelect(reserva)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center gap-3 w-full px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                      isSelected ? "bg-muted/80" : "hover:bg-muted/50"
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: zonaColor }}
                    >
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">
                        {reserva.nombre}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 truncate">
                        <span>Zona {reserva.zona}</span>
                        {reserva.fotos.length > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">
                              {reserva.fotos.length}{" "}
                              {reserva.fotos.length === 1 ? "foto" : "fotos"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-5 text-center">
                <p className="text-sm font-semibold text-foreground">
                  No se encontraron reservas
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {reservas.length === 0
                    ? "Todavía no hay reservas cargadas desde Supabase."
                    : `No hay coincidencias para "${searchQuery}".`}
                </p>
                <button
                  type="button"
                  onClick={handleClear}
                  className="mt-3 inline-flex items-center justify-center min-h-[36px] px-4 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Limpiar búsqueda
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
