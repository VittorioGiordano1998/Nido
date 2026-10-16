import type { Framing } from './photos'

/** Photo layer used behind item rows, list cards and the cover banner.
 *  The parent must be `relative overflow-hidden`; content sits above it. */
export function BackdropPhoto({ url, framing }: { url: string; framing: Framing }) {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <img
        src={url}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover"
        style={{
          objectPosition: `${framing.x}% ${framing.y}%`,
          transform: `scale(${framing.zoom})`,
        }}
      />
      <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/15" />
    </span>
  )
}
