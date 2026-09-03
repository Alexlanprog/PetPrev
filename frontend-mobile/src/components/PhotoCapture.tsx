import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RotateCcw } from "lucide-react";

interface PhotoCaptureProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  label?: string;
}

export function PhotoCapture({ value, onChange, label = "Capturar foto" }: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {value ? (
        <div className="space-y-2">
          <img
            src={value}
            alt="Registro fotográfico do display da caixa térmica"
            className="h-52 w-full rounded-xl border border-border object-cover"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-2"
            onClick={() => inputRef.current?.click()}
          >
            <RotateCcw className="size-4" /> Refazer foto
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-52 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/50 text-muted-foreground transition-colors hover:bg-secondary"
        >
          <Camera className="size-7" />
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs">Evidência obrigatória do termômetro</span>
        </button>
      )}
    </div>
  );
}
