import { useRef, useState } from "react";
import { Upload, User2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AvatarUploaderProps {
  userId: string;
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  className?: string;
}

export function AvatarUploader({ userId, currentUrl, onUploaded, className }: AvatarUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/avatar.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadErr) {
        // Graceful fallback: still use the local preview for demo
        toast.warning("Storage upload failed — using local preview");
        onUploaded(objectUrl);
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      onUploaded(data.publicUrl);
      toast.success("Avatar updated");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {/* Preview circle */}
      <div
        className={cn(
          "relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all",
          dragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/60"
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {preview ? (
          <img src={preview} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <User2 className="h-10 w-10 text-muted-foreground" />
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        )}
        <div className="absolute bottom-1 right-1 rounded-full bg-primary p-1 shadow-elegant">
          <Upload className="h-3 w-3 text-primary-foreground" />
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      <div className="text-center">
        <p className="text-xs font-medium text-muted-foreground">
          Click or drag to upload photo
        </p>
        <p className="text-xs text-muted-foreground/60">PNG, JPG up to 5 MB</p>
      </div>

      {preview && (
        <button
          type="button"
          onClick={() => { setPreview(null); onUploaded(""); }}
          className="inline-flex items-center gap-1 text-xs text-destructive hover:underline"
        >
          <X className="h-3 w-3" /> Remove photo
        </button>
      )}
    </div>
  );
}
