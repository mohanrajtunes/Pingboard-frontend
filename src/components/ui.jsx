import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { clock, dateTime, ms } from "../lib/format";

// A status is shown by shape and word, and colour only when something is wrong.
export function StatusDot({ status }) {
  return <span className={`dot dot-${status || "unknown"}`} aria-hidden="true" />;
}

export function Status({ status }) {
  const label = { up: "Up", down: "Down", unknown: "Waiting" }[status] || "Waiting";
  return (
    <span className={`status status-${status || "unknown"}`}>
      <StatusDot status={status} />
      {label}
    </span>
  );
}

// The heartbeat: one bar per check, oldest on the left. Failed checks are red.
// `checks` is a list of booleans (true = ok), oldest first.
export function Strip({ checks, size = 60, label }) {
  const bars = [];
  const padding = Math.max(0, size - checks.length);
  for (let i = 0; i < padding; i += 1) bars.push("none");
  checks.slice(-size).forEach((ok) => bars.push(ok ? "ok" : "fail"));
  const failed = checks.slice(-size).filter((ok) => !ok).length;
  return (
    <span
      className="strip"
      role="img"
      aria-label={label || `${checks.length} recent checks, ${failed} failed`}
    >
      {bars.map((kind, i) => (
        <i key={i} className={`bar bar-${kind}`} />
      ))}
    </span>
  );
}

function useWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const update = () => setWidth(node.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

const niceMax = (value) => {
  if (!value || value <= 0) return 100;
  const steps = [50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000];
  return steps.find((s) => s >= value * 1.1) || Math.ceil(value / 1000) * 1000;
};

// Response time over a period: one 2px line in ink, a y scale, and incident
// spans in the signal colour. A period with no checks is a gap, not a zero.
export function LineChart({ points, spans = [], height = 240, empty = "No checks in this range." }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);
  const pad = { top: 14, right: 12, bottom: 28, left: 52 };
  const valid = points.filter((p) => p.v !== null && p.v !== undefined);

  if (!valid.length) {
    return (
      <div ref={ref} className="chart-empty" style={{ height }}>
        {empty}
      </div>
    );
  }

  const t0 = new Date(points[0].t).getTime();
  const t1 = new Date(points[points.length - 1].t).getTime();
  const span = Math.max(1, t1 - t0);
  const yMax = niceMax(Math.max(...valid.map((p) => p.v)));
  const innerW = Math.max(10, width - pad.left - pad.right);
  const innerH = height - pad.top - pad.bottom;
  const x = (t) => pad.left + ((new Date(t).getTime() - t0) / span) * innerW;
  const y = (v) => pad.top + innerH - (v / yMax) * innerH;

  // Break the line where a bucket has no data.
  const segments = [];
  let current = [];
  points.forEach((p) => {
    if (p.v === null || p.v === undefined) {
      if (current.length) segments.push(current);
      current = [];
    } else {
      current.push(p);
    }
  });
  if (current.length) segments.push(current);

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax);
  const xTicks = [0, 1 / 3, 2 / 3, 1].map((f) => new Date(t0 + f * span).toISOString());
  const longRange = span > 36 * 3600 * 1000;

  return (
    <div ref={ref} className="chart" style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label="Average response time over the selected range"
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            let best = null;
            valid.forEach((p) => {
              const d = Math.abs(x(p.t) - mx);
              if (!best || d < best.d) best = { d, p };
            });
            setHover(best?.p || null);
          }}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} className="grid" />
              <text x={pad.left - 8} y={y(tick) + 4} textAnchor="end" className="axis">
                {Math.round(tick)} ms
              </text>
            </g>
          ))}
          {spans.map((s, i) => {
            const a = Math.max(x(s.from), pad.left);
            const b = Math.min(x(s.to), width - pad.right);
            if (b <= a) return null;
            return <rect key={i} x={a} y={pad.top} width={Math.max(2, b - a)} height={innerH} className="span" />;
          })}
          {segments.map((seg, i) =>
            seg.length === 1 ? (
              <circle key={i} cx={x(seg[0].t)} cy={y(seg[0].v)} r="2.5" className="line-dot" />
            ) : (
              <polyline
                key={i}
                className="line"
                points={seg.map((p) => `${x(p.t)},${y(p.v)}`).join(" ")}
              />
            )
          )}
          {xTicks.map((t, i) => (
            <text
              key={t}
              x={x(t)}
              y={height - 8}
              textAnchor={i === 0 ? "start" : i === xTicks.length - 1 ? "end" : "middle"}
              className="axis"
            >
              {longRange ? dateTime(t).split(",")[0] : clock(t)}
            </text>
          ))}
          {hover && (
            <g>
              <line x1={x(hover.t)} x2={x(hover.t)} y1={pad.top} y2={pad.top + innerH} className="cursor" />
              <circle cx={x(hover.t)} cy={y(hover.v)} r="4" className="line-dot" />
            </g>
          )}
        </svg>
      )}
      {hover && (
        <div
          className="tooltip"
          style={{ left: Math.min(Math.max(x(hover.t), 80), Math.max(80, width - 80)), top: 0 }}
        >
          <span className="num">{ms(hover.v)}</span>
          <span className="muted">{dateTime(hover.t)}</span>
        </div>
      )}
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previous = document.activeElement;
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={title}>
        <div className="dialog-head">
          <h2>{title}</h2>
          <button className="btn-text" onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, error, hint, children, htmlFor }) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && !error && <p className="hint">{hint}</p>}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
