import { useEffect, useState } from "react";
import { Camera, ImageOff, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { fetchFotosByReserva, uploadReservaFoto } from "@/services/reservasService";
import { Reserva, ReservaFoto, ZONA_COLORES } from "@/types/reserva";

interface PhotoGalleryModalProps {
  reserva: Reserva | null;
  onClose: () => void;
  onPhotoAdded: (reservaId: string, newPhoto: ReservaFoto) => void;
}

const PhotoGalleryModal = ({
  reserva,
  onClose,
  onPhotoAdded,
}: PhotoGalleryModalProps) => {
  const [photos, setPhotos] = useState<ReservaFoto[]>([]);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [autor, setAutor] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!reserva) return;
    let active = true;

    const loadPhotos = async () => {
      setLoading(true);
      setBrokenImages(new Set());
      try {
        const loaded = await fetchFotosByReserva(reserva.id, reserva.fotos);
        if (active) setPhotos(loaded);
      } catch (err) {
        console.error("Error cargando fotos:", err);
        if (active) setPhotos(reserva.fotos);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPhotos();
    return () => {
      active = false;
    };
  }, [reserva]);

  if (!reserva) return null;

  const zonaColor = ZONA_COLORES[reserva.zona];

  const handleUpload = async () => {
    if (!file) return;
    if (!isSupabaseConfigured) {
      toast.error("Configurá VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para subir fotos.");
      return;
    }

    setUploading(true);
    try {
      const created = await uploadReservaFoto({
        reserva,
        file,
        autor,
      });
      setPhotos((prev) => [created, ...prev]);
      onPhotoAdded(reserva.id, created);
      setAutor("");
      setFile(null);
      const input = document.getElementById("reserva-foto-input") as HTMLInputElement | null;
      if (input) input.value = "";
      toast.success("Foto subida correctamente.");
    } catch (err) {
      console.error("Error al subir foto:", err);
      toast.error("No se pudo subir la foto. Intentá de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#3d2b1f]/60 backdrop-blur-xs p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-modal-title"
    >
      <div className="bg-[#faf7f2] text-[#3d2b1f] border border-[#d8ccb8] border-t-[6px] border-t-[#4a7c4a] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="sticky top-0 bg-[#faf7f2] border-b border-[#d8ccb8] p-4 flex items-start justify-between gap-3 z-10">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-medium text-[#3d2b1f]/75 mb-1">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 border border-[#3d2b1f]/25"
                style={{ backgroundColor: zonaColor }}
                aria-hidden="true"
              />
              <span>Zona {reserva.zona}</span>
            </div>
            <h2
              id="gallery-modal-title"
              className="font-display text-xl font-bold tracking-wide text-[#2d4a2d] leading-snug"
            >
              {reserva.nombre}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar galería"
            className="flex items-center justify-center w-9 h-9 rounded-xl text-[#3d2b1f]/70 hover:text-[#2d4a2d] hover:bg-[#f5f0e8] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          <div>
            <p className="text-xs font-semibold text-[#2d4a2d] mb-2.5">
              Galería de la reserva
            </p>

            <div className="grid grid-cols-2 gap-2.5 max-h-64 overflow-y-auto custom-scrollbar pr-0.5">
              {loading ? (
                <p className="col-span-2 text-xs text-[#3d2b1f]/70 py-4 text-center">
                  Cargando fotografías...
                </p>
              ) : photos.length === 0 ? (
                <div className="col-span-2 rounded-xl border border-dashed border-[#c8a96e] bg-[#f5f0e8] py-6 px-4 text-center">
                  <Camera className="w-5 h-5 text-[#4a7c4a] mx-auto mb-1.5" />
                  <p className="text-xs text-[#3d2b1f]/80">
                    Todavía no hay fotos cargadas para esta reserva.
                  </p>
                </div>
              ) : (
                photos.map((foto) => {
                  const isBroken = brokenImages.has(foto.id);
                  return (
                    <div key={foto.id} className="space-y-1">
                      {isBroken ? (
                        <div className="w-full h-28 rounded-xl border border-[#d8ccb8] bg-[#f5f0e8] flex flex-col items-center justify-center gap-1 text-[#3d2b1f]/70 px-2 text-center">
                          <ImageOff className="w-4 h-4" />
                          <span className="text-[11px]">Imagen no disponible</span>
                        </div>
                      ) : (
                        <img
                          src={foto.url}
                          alt={`Fotografía de ${reserva.nombre}${foto.autor ? ` por ${foto.autor}` : ""}`}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setBrokenImages((prev) => new Set(prev).add(foto.id))
                          }
                          className="w-full h-28 object-cover rounded-xl border border-[#d8ccb8] bg-[#f5f0e8]"
                        />
                      )}
                      {foto.autor && (
                        <p className="text-[11px] text-[#3d2b1f]/75 truncate px-0.5">
                          Por {foto.autor}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="border-t border-[#d8ccb8] pt-4 space-y-3">
            <p className="text-xs font-semibold text-[#2d4a2d]">
              Subí una foto de esta reserva
            </p>

            {!isSupabaseConfigured && (
              <p className="text-xs text-[#3d2b1f]/85 bg-[#f5f0e8] border border-[#c8a96e]/60 rounded-xl px-3 py-2.5 leading-relaxed">
                La subida de fotos se habilitará al completar{" "}
                <code className="font-mono text-[11px]">VITE_SUPABASE_URL</code> y{" "}
                <code className="font-mono text-[11px]">VITE_SUPABASE_ANON_KEY</code>.
              </p>
            )}

            <input
              type="text"
              value={autor}
              onChange={(e) => setAutor(e.target.value)}
              placeholder="Tu nombre (opcional)"
              className="w-full min-h-[40px] px-3 py-2 text-sm rounded-xl border border-[#cbbda6] bg-white text-[#3d2b1f] placeholder:text-[#3d2b1f]/50 focus:outline-none focus:ring-2 focus:ring-[#4a7c4a]"
            />

            <label
              htmlFor="reserva-foto-input"
              className="flex items-center justify-between gap-2 w-full min-h-[42px] px-3 py-2 rounded-xl border border-dashed border-[#c8a96e] bg-[#f5f0e8] hover:bg-[#ebe3d3] transition-colors cursor-pointer text-xs text-[#3d2b1f]/80"
            >
              <span className="truncate">
                {file ? file.name : "Seleccionar imagen (JPG, PNG, WebP)"}
              </span>
              <Upload className="w-4 h-4 shrink-0 text-[#2d4a2d]" />
              <input
                id="reserva-foto-input"
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="sr-only"
              />
            </label>

            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || !file || !isSupabaseConfigured}
              className="w-full min-h-[42px] py-2.5 px-4 rounded-xl bg-[#4a7c4a] text-[#faf7f2] font-semibold text-sm transition-colors hover:bg-[#2d4a2d] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              {uploading ? "Subiendo foto..." : "Subir foto"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoGalleryModal;
