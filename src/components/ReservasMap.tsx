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

// Encuadre que incluye CABA, zona norte (Pilar, Maschwitz, Tigre), Campana y Laferrere
const AMBA_CENTER: [number, number] = [-34.55, -58.65];
const AMBA_DEFAULT_ZOOM = 10;

// Mapa base OpenStreetMap estándar (calles, parques, nombres). Crédito en el pie del sidebar
const OSM_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

const buildParkSignPinSvg = (zoneColor: string) => `
<svg viewBox="0 0 42 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M7 6C7 4.34315 8.34315 3 10 3H32C33.6569 3 35 4.34315 35 6V26.5C35 31.8 27.5 38.2 21 44.2C14.5 38.2 7 31.8 7 26.5V6Z" stroke="#faf7f2" stroke-width="6.4" stroke-linejoin="round"/>
  <path d="M7 6C7 4.34315 8.34315 3 10 3H32C33.6569 3 35 4.34315 35 6V26.5C35 31.8 27.5 38.2 21 44.2C14.5 38.2 7 31.8 7 26.5V6Z" fill="#c8a96e" stroke="#3d2b1f" stroke-width="2.4" stroke-linejoin="round"/>
  <rect x="10.5" y="6.5" width="21" height="21" rx="4" fill="#faf7f2" fill-opacity="0.32" stroke="#3d2b1f" stroke-width="1.2"/>
  <path d="M21 9.5L15.5 17.5H19L14.5 23.5H27.5L23 17.5H26.5L21 9.5Z" fill="#2d4a2d" stroke="#3d2b1f" stroke-width="1.1" stroke-linejoin="round"/>
  <path d="M21 23.5V27" stroke="#3d2b1f" stroke-width="1.8" stroke-linecap="round"/>
  <circle cx="21" cy="34.5" r="3.2" fill="${zoneColor}" stroke="#3d2b1f" stroke-width="1.2"/>
</svg>
`;

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

  // Inicializar mapa Leaflet con OpenStreetMap; la atribución va en el sidebar
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(AMBA_CENTER, AMBA_DEFAULT_ZOOM);
    mapRef.current = map;

    L.control.zoom({ position: "bottomleft" }).addTo(map);

    lightTilesRef.current = L.tileLayer(OSM_URL, {
      maxZoom: 19,
      className: "osm-tile-layer",
    }).addTo(map);

    // Capa de nombres de calles de Esri encima de OSM, para tramos sin nombre en OpenStreetMap
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19, className: "labels-tile-layer", pane: "overlayPane" }
    ).addTo(map);

    darkTilesRef.current = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 19,
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

  const createPinIcon = useCallback((zoneColor: string) => {
    return L.divIcon({
      className: "custom-div-icon",
      html: `<div class="reserva-pin-sign">${buildParkSignPinSvg(zoneColor)}</div>`,
      iconSize: [38, 44],
      iconAnchor: [19, 43],
      popupAnchor: [0, -38],
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
      const marker = L.marker(reserva.coordenadas, {
        icon,
        zIndexOffset: 500,
      });

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
          title={isDark ? "Cambiar a mapa topográfico" : "Cambiar a mapa nocturno"}
          aria-label={isDark ? "Cambiar a mapa topográfico" : "Cambiar a mapa nocturno"}
          className="w-11 h-11 rounded-full bg-[#faf7f2] dark:bg-[#2d4a2d] border border-[#3d2b1f]/25 dark:border-[#c8a96e]/40 shadow-md flex items-center justify-center text-[#2d4a2d] dark:text-[#faf7f2] hover:bg-[#f5f0e8] dark:hover:bg-[#4a7c4a] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a7c4a]"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button
          type="button"
          onClick={handleLocateMe}
          title="Centrar en mi ubicación"
          aria-label="Centrar en mi ubicación"
          className="w-11 h-11 rounded-full bg-[#faf7f2] dark:bg-[#2d4a2d] border border-[#3d2b1f]/25 dark:border-[#c8a96e]/40 shadow-md flex items-center justify-center text-[#2d4a2d] dark:text-[#faf7f2] hover:bg-[#f5f0e8] dark:hover:bg-[#4a7c4a] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a7c4a]"
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
          <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-[#faf7f2]/95 dark:bg-[#2d4a2d]/95 backdrop-blur-md border border-[#3d2b1f]/25 dark:border-[#c8a96e]/40 border-t-4 border-t-[#4a7c4a] shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-[#f5f0e8] dark:bg-[#4a7c4a]/50 border border-[#c8a96e]/50 flex items-center justify-center text-[#2d4a2d] dark:text-[#faf7f2] shrink-0 mt-0.5">
              <Trees className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              {!isConfigured ? (
                <>
                  <p className="text-xs sm:text-sm font-semibold text-[#2d4a2d] dark:text-[#faf7f2]">
                    Sin conexión a Supabase
                  </p>
                  <p className="text-xs text-[#3d2b1f]/80 dark:text-[#c8a96e] mt-0.5 leading-relaxed">
                    Completá{" "}
                    <code className="font-mono text-[11px]">VITE_SUPABASE_URL</code> y{" "}
                    <code className="font-mono text-[11px]">VITE_SUPABASE_ANON_KEY</code>{" "}
                    para cargar las reservas ecológicas de Buenos Aires y AMBA.
                  </p>
                </>
              ) : loadError ? (
                <>
                  <p className="text-xs sm:text-sm font-semibold text-[#2d4a2d] dark:text-[#faf7f2]">
                    Error de conexión
                  </p>
                  <p className="text-xs text-[#3d2b1f]/80 dark:text-[#c8a96e] mt-0.5 leading-relaxed">
                    {loadError}
                  </p>
                </>
              ) : reservas.length === 0 ? (
                <>
                  <p className="text-xs sm:text-sm font-semibold text-[#2d4a2d] dark:text-[#faf7f2]">
                    Todavía no hay reservas cargadas
                  </p>
                  <p className="text-xs text-[#3d2b1f]/80 dark:text-[#c8a96e] mt-0.5 leading-relaxed">
                    Agregá registros en la tabla{" "}
                    <code className="font-mono text-[11px]">reservas</code> de tu
                    proyecto Supabase para verlas en el mapa.
                  </p>
                </>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-[#2d4a2d] dark:text-[#faf7f2]">
                      Sin reservas en esta selección
                    </p>
                    <p className="text-xs text-[#3d2b1f]/80 dark:text-[#c8a96e] mt-0.5">
                      Probá cambiando la zona o limpiando la búsqueda.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveZona("Todas");
                      setSearchQuery("");
                    }}
                    className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#c8a96e] text-[#3d2b1f] text-xs font-semibold hover:bg-[#be9b59] transition-colors cursor-pointer whitespace-nowrap shrink-0"
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
