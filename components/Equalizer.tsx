// Small animated equalizer used in the "generating" state instead of a plain
// spinner. Pure CSS keyframes (see tailwind.config.ts `eq`); bars stay static
// under prefers-reduced-motion via the motion-safe: variant.

export default function Equalizer() {
  const bars = [0, 1, 2, 3, 4];
  return (
    <div className="mx-auto flex h-16 items-end justify-center gap-1.5" aria-hidden="true">
      {bars.map((i) => (
        <span
          key={i}
          className="h-full w-2.5 origin-bottom rounded-full bg-gradient-to-t from-fuchsia-500 to-orange-400 motion-safe:animate-eq"
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  );
}
