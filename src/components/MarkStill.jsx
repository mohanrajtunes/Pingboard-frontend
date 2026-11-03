// Static pulse mark: shown while the liquid-metal shader loads, and when WebGL
// is unavailable or motion is reduced.
export default function MarkStill({ size = 340 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 400 400" role="img" aria-label="PingBoard pulse mark">
      <defs>
        <linearGradient id="ms" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#e4f79a" />
          <stop offset="1" stopColor="#8fb81a" />
        </linearGradient>
      </defs>
      <path d="M30 210 H120 L160 90 L230 320 L275 210 H370" fill="none" stroke="url(#ms)" strokeWidth="46" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
