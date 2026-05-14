import { Image as ImageIcon, Pin, Star } from 'lucide-react'

interface ImageThumbnailCardProps {
  title: string
  fileUrl: string | null
  fileName: string | null
  isFavorite: boolean
  isPinned: boolean
}

export function ImageThumbnailCard({
  title,
  fileUrl,
  fileName,
  isFavorite,
  isPinned,
}: ImageThumbnailCardProps) {
  return (
    <div className="group h-full overflow-hidden rounded-xl border bg-card transition-colors hover:bg-accent/50">
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {fileUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fileUrl}
            alt={fileName || title}
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}

        {(isPinned || isFavorite) && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-1 backdrop-blur-sm">
            {isPinned && <Pin className="h-3.5 w-3.5 text-white" />}
            {isFavorite && (
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            )}
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="truncate text-sm font-medium" title={title}>{title}</h3>
      </div>
    </div>
  )
}
