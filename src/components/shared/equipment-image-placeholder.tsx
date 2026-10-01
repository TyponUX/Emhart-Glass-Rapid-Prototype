import { Image as ImageIcon } from "lucide-react";
import { plantImageAssets } from "@/data/plant-image-assets";
import { cn } from "@/lib/utils";

export function EquipmentImagePlaceholder({
  pictureNumber,
  description,
  className = "",
}: {
  pictureNumber: number;
  description: string;
  className?: string;
}) {
  const imageUrl = plantImageAssets[pictureNumber];
  const imageExtension = pictureNumber >= 10 ? "jpg" : "png";

  return (
    <div
      role="img"
      aria-label={`Image ${pictureNumber} for ${description}`}
      className={cn("relative flex min-h-20 flex-col items-center justify-center gap-1 overflow-hidden border bg-muted/50 p-3 text-center", className)}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={`Image ${pictureNumber}: ${description}`} className="h-full max-h-64 w-full object-contain" />
      ) : (
        <>
          <ImageIcon className="size-5 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-semibold">Image {pictureNumber}</span>
          <span className="text-xs text-muted-foreground">{pictureNumber}.{imageExtension}</span>
        </>
      )}
    </div>
  );
}