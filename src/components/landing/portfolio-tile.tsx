import type { PortfolioItem } from "@/lib/types";

// Плитка портфолио. Пока нет реальных фото — рисуем стилизованный
// плейсхолдер (без внешних зависимостей и без расхода квоты Image на Vercel).
// Когда появятся фото в Supabase Storage — рендерим next/image по item.url.
export function PortfolioTile({
  item,
  index,
}: {
  item: PortfolioItem;
  index: number;
}) {
  return (
    <figure
      className="group relative aspect-[3/4] overflow-hidden border border-ink-700 bg-ink-900 animate-fade-up"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      {item.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.url}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="absolute inset-0 opacity-40 transition-opacity duration-500 group-hover:opacity-60"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg,#1d1d20 0 2px,transparent 2px 9px)",
            }}
          />
          <span className="display text-7xl text-ink-600 transition-colors duration-500 group-hover:text-blood/40">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
      )}

      <figcaption className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-ink-950 via-ink-950/80 to-transparent p-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
        <p className="label mb-1 text-blood">{item.style}</p>
        <p className="font-medium text-bone">{item.title}</p>
      </figcaption>
    </figure>
  );
}
