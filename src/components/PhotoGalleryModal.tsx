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
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-foreground/65 backdrop-blur-xs p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-modal-title"
    >
      <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-start justify-between gap-3 z-10">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: zonaColor }}
                aria-hidden="true"
              />
              <span>Zona {reserva.zona}</span>
            </div>
            <h2
              id="gallery-modal-title"
              className="font-display text-lg font-bold text-foreground leading-snug"
            >
              {reserva.nombre}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar galería"
            className="flex items-center justify-center w-9 h-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          <div>
            <p className="text-xs font-semibold text-foreground mb-2.5">
              Galería de la reserva
            </p>

            <div className="grid grid-cols-2 gap-2.5 max-h-64 overflow-y-auto custom-scrollbar pr-0.5">
              {loading ? (
                <p className="col-span-2 text-xs text-muted-foreground py-4 text-center">
                  Cargando fotografías...
                </p>
              ) : photos.length === 0 ? (
                <div className="col-span-2 rounded-xl border border-dashed border-border bg-muted/40 py-6 px-4 text-center">
                  <Camera className="w-5 h-5 text-muted-foreground mx-auto mb-1.5" />
                  <p className="text-xs text-muted-foreground">
                    Todavía no hay fotos cargadas para esta reserva.
                  </p>
                </div>
              ) : (
                photos.map((foto) => {
                  const isBroken = brokenImages.has(foto.id);
                  return (
                    <div key={foto.id} className="space-y-1">
                      {isBroken ? (
                        <div className="w-full h-28 rounded-xl border border-border bg-muted/60 flex flex-col items-center justify-center gap-1 text-muted-foreground px-2 text-center">
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
                          className="w-full h-28 object-cover rounded-xl border border-border bg-muted/30"
                        />
                      )}
                      {foto.autor && (
                        <p className="text-[11px] text-muted-foreground truncate px-0.5">
                          Por {foto.autor}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-xs font-semibold text-foreground">
              Subí una foto de esta reserva
            </p>

            {!isSupabaseConfigured && (
              <p className="text-xs text-muted-foreground bg-muted/60 border border-border rounded-xl px-3 py-2.5 leading-relaxed">
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
              className="w-full min-h-[40px] px-3 py-2 text-sm rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />

            <label
              htmlFor="reserva-foto-input"
              className="flex items-center justify-between gap-2 w-full min-h-[42px] px-3 py-2 rounded-xl border border-dashed border-input bg-background hover:bg-muted/40 transition-colors cursor-pointer text-xs text-muted-foreground"
            >
              <span className="truncate">
                {file ? file.name : "Seleccionar imagen (JPG, PNG, WebP)"}
              </span>
              <Upload className="w-4 h-4 shrink-0 text-primary" />
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
              className="w-full min-h-[42px] py-2.5 px-4 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm transition-opacity hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
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
