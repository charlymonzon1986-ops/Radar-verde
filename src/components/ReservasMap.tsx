import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createRoot, Root } from "react-dom/client";
import { LocateFixed, Moon, Sun, Trees } from "lucide-react";
import { toast } from "sonner";
import { fetchReservas } from "@/services/reservasService";
import {
  FiltroZona,
  Reserva,
  ReservaFoto,
  ZONA_COLORES,
} from "@/types/reserva";
import MapPopup from "./MapPopup";
import PhotoGalleryModal from "./PhotoGalleryModal";
import SearchBar from "./SearchBar";
import ZoneFilterMenu from "./ZoneFilterMenu";

const AMBA_CENTER: [number, number] = [-34.6037, -58.3816];
const AMBA_DEFAULT_ZOOM = 12;

const LEAF_PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`;

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const ReservasMap = () => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const popupRootsRef = useRef<Root[]>([]);
  const lightTilesRef = useRef<L.TileLayer | null>(null);
  const darkTilesRef = useRef<L.TileLayer | null>(null);

  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeZona, setActiveZona] = useState<FiltroZona>("Todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [galleryReserva, setGalleryReserva] = useState<Reserva | null>(null);
  const [isDark, setIsDark] = useState(false);

  // Cargar reservas ecológicas desde Supabase
  useEffect(() => {
    let active = true;

    const loadReservas = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        // TODO: conectar a Supabase nuevo — fetchReservas consulta la tabla "reservas" cuando las variables de entorno están configuradas.
        const result = await fetchReservas();
        if (!active) return;
        setReservas(result.reservas);
        setIsConfigured(result.configured);
      } catch (err) {
        console.error("Error al cargar reservas:", err);
        if (!active) return;
        setIsConfigured(true);
        setLoadError("No se pudieron cargar las reservas desde Supabase.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadReservas();
    return () => {
      active = false;
    };
  }, []);

  // Inicializar mapa Leaflet centrado en Buenos Aires y AMBA
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
    }).setView(AMBA_CENTER, AMBA_DEFAULT_ZOOM);
    mapRef.current = map;

    L.control.zoom({ position: "bottomleft" }).addTo(map);

    lightTilesRef.current = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "&copy; OpenStreetMap contributors",
      }
    ).addTo(map);

    darkTilesRef.current = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution: "&copy; OpenStreetMap &copy; CARTO",
      }
    );

    markersGroupRef.current.addTo(map);

    map.on("locationerror", () => {
      toast.error("No pudimos obtener tu ubicación actual.");
    });

    return () => {
      popupRootsRef.current.forEach((root) => root.unmount());
      popupRootsRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sincronizar clase .dark en <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const filteredReservas = useMemo(() => {
    const q = normalize(searchQuery);
    return reservas.filter((reserva) => {
      if (activeZona !== "Todas" && reserva.zona !== activeZona) {
        return false;
      }
      if (!q) return true;
      return (
        normalize(reserva.nombre).includes(q) ||
        normalize(reserva.zona).includes(q) ||
        normalize(reserva.descripcion).includes(q)
      );
    });
  }, [reservas, activeZona, searchQuery]);

  const createPinIcon = useCallback((color: string) => {
    return L.divIcon({
      className: "custom-div-icon",
      html: `<div class="reserva-pin" style="background:${color}">${LEAF_PIN_SVG}</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -30],
    });
  }, []);

  // Renderizar pines de reservas ecológicas
  useEffect(() => {
    const group = markersGroupRef.current;
    group.clearLayers();
    markersMapRef.current.clear();

    const prevRoots = popupRootsRef.current;
    popupRootsRef.current = [];
    queueMicrotask(() => {
      prevRoots.forEach((root) => root.unmount());
    });

    filteredReservas.forEach((reserva) => {
      const color = ZONA_COLORES[reserva.zona];
      const icon = createPinIcon(color);
      const marker = L.marker(reserva.coordenadas, { icon });

      const popupDiv = document.createElement("div");
      const root = createRoot(popupDiv);
      root.render(
        <MapPopup
          reserva={reserva}
          onOpenGallery={(selected) => {
            setGalleryReserva(selected);
            mapRef.current?.closePopup();
          }}
        />
      );
      popupRootsRef.current.push(root);

      marker.bindPopup(popupDiv);
      group.addLayer(marker);
      markersMapRef.current.set(reserva.id, marker);
    });
  }, [filteredReservas, createPinIcon]);

  const handleSelectReservaFromSearch = (reserva: Reserva) => {
    if (activeZona !== "Todas" && reserva.zona !== activeZona) {
      setActiveZona("Todas");
    }
    if (mapRef.current) {
      mapRef.current.flyTo(reserva.coordenadas, 15, { duration: 1.1 });
      setTimeout(() => {
        const marker = markersMapRef.current.get(reserva.id);
        marker?.openPopup();
      }, 350);
    }
  };

  const handleLocateMe = () => {
    mapRef.current?.locate({ setView: true, maxZoom: 15 });
  };

  const toggleDarkMode = () => {
    const map = mapRef.current;
    if (!map) return;

    if (isDark) {
      if (darkTilesRef.current) map.removeLayer(darkTilesRef.current);
      if (lightTilesRef.current) lightTilesRef.current.addTo(map);
    } else {
      if (lightTilesRef.current) map.removeLayer(lightTilesRef.current);
      if (darkTilesRef.current) darkTilesRef.current.addTo(map);
    }
    setIsDark((prev) => !prev);
  };

  const handlePhotoAdded = (reservaId: string, newPhoto: ReservaFoto) => {
    setReservas((prev) =>
      prev.map((item) =>
        item.id === reservaId
          ? { ...item, fotos: [newPhoto, ...item.fotos] }
          : item
      )
    );
    setGalleryReserva((prev) =>
      prev && prev.id === reservaId
        ? { ...prev, fotos: [newPhoto, ...prev.fotos] }
        : prev
    );
  };

  const showEmptyNotice = !loading && filteredReservas.length === 0;

  return (
    <main className="relative w-full h-screen overflow-hidden bg-background">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Barra de búsqueda superior */}
      <div className="absolute top-3 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[420px] md:w-[460px] z-[1000]">
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          reservas={reservas}
          onSelectReserva={handleSelectReservaFromSearch}
        />
      </div>

      {/* Menú hamburguesa con filtro único por zona geográfica */}
      <ZoneFilterMenu activeZona={activeZona} onZonaChange={setActiveZona} />

      {/* Controles flotantes del mapa */}
      <div className="absolute bottom-7 right-4 flex flex-col gap-2.5 z-[1000]">
        <button
          type="button"
          onClick={toggleDarkMode}
          title={isDark ? "Cambiar a mapa claro" : "Cambiar a mapa nocturno"}
          aria-label={isDark ? "Cambiar a mapa claro" : "Cambiar a mapa nocturno"}
          className="w-11 h-11 rounded-full bg-card/95 backdrop-blur-md border border-border shadow-md flex items-center justify-center text-foreground hover:bg-muted/70 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button
          type="button"
          onClick={handleLocateMe}
          title="Centrar en mi ubicación"
          aria-label="Centrar en mi ubicación"
          className="w-11 h-11 rounded-full bg-card/95 backdrop-blur-md border border-border shadow-md flex items-center justify-center text-foreground hover:bg-muted/70 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LocateFixed className="w-5 h-5" />
        </button>
      </div>

      {/* Estado vacío cuando no hay Supabase configurado o no hay reservas */}
      {showEmptyNotice && (
        <div
          className="absolute bottom-7 left-1/2 -translate-x-1/2 z-[1000] w-[calc(100%-6rem)] max-w-md pointer-events-auto"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-card/95 backdrop-blur-md border border-border shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-primary shrink-0 mt-0.5">
              <Trees className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              {!isConfigured ? (
                <>
                  <p className="text-xs sm:text-sm font-semibold text-foreground">
                    Sin conexión a Supabase
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Completá{" "}
                    <code className="font-mono text-[11px]">VITE_SUPABASE_URL</code> y{" "}
                    <code className="font-mono text-[11px]">VITE_SUPABASE_ANON_KEY</code>{" "}
                    para cargar las reservas ecológicas de Buenos Aires y AMBA.
                  </p>
                </>
              ) : loadError ? (
                <>
                  <p className="text-xs sm:text-sm font-semibold text-foreground">
                    Error de conexión
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {loadError}
                  </p>
                </>
              ) : reservas.length === 0 ? (
                <>
                  <p className="text-xs sm:text-sm font-semibold text-foreground">
                    Todavía no hay reservas cargadas
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Agregá registros en la tabla{" "}
                    <code className="font-mono text-[11px]">reservas</code> de tu
                    proyecto Supabase para verlas en el mapa.
                  </p>
                </>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-foreground">
                      Sin reservas en esta selección
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Probá cambiando la zona o limpiando la búsqueda.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveZona("Todas");
                      setSearchQuery("");
                    }}
                    className="min-h-[36px] px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Ver todas
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {galleryReserva && (
        <PhotoGalleryModal
          reserva={galleryReserva}
          onClose={() => setGalleryReserva(null)}
          onPhotoAdded={handlePhotoAdded}
        />
      )}
    </main>
  );
};

export default ReservasMap;
