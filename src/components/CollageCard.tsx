"use client";

/**
 * Decorative category card used in the home hero collage. Pass `imageSrc`
 * once real artwork is available — until then it renders a themed
 * gradient + icon placeholder so the layout is ready to receive images.
 */
export function CollageCard({
  emoji,
  from,
  to,
  imageSrc,
  imageAlt,
  className = "",
  style,
}: {
  emoji: string;
  from: string;
  to: string;
  imageSrc?: string;
  imageAlt?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl border border-border shadow-2xl overflow-hidden shrink-0 ${className}`}
      style={style}
    >
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageSrc} alt={imageAlt ?? ""} className="w-full h-full object-cover" />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center text-4xl"
          style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
        >
          {emoji}
        </div>
      )}
    </div>
  );
}
