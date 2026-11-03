import { useEffect, useRef } from "react";

/*
 * Border beam and Ripple, adapted from Magic UI (MIT), via the Subframe motion
 * library: https://magicui.design/docs/components/border-beam
 *                https://magicui.design/docs/components/ripple
 * Copyright (c) Magic UI. Permission is granted under the MIT licence to use,
 * copy, modify and distribute this software, provided this notice is kept.
 * Changes: native CSS (see landing.css), theme colours, pauses off screen.
 */

// Runs `fn(visible)` whenever the element enters or leaves the viewport.
function useVisible(ref, fn) {
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const io = new IntersectionObserver(([e]) => fn(e.isIntersecting), { threshold: 0 });
    io.observe(node);
    return () => io.disconnect();
  }, [ref, fn]);
}

// A small light that travels the 1px border of its parent. The parent must be
// position: relative and pass its corner radius.
export function BorderBeam({ radius = 24 }) {
  const ref = useRef(null);
  useVisible(ref, (v) => ref.current?.setAttribute("data-running", String(v)));
  return (
    <div className="beam" ref={ref} aria-hidden="true" style={{ "--r": `${radius}px` }}>
      <div className="beam-light" style={{ offsetPath: `rect(0 auto auto 0 round ${radius}px)` }} />
    </div>
  );
}

// Concentric rings that breathe around a focal point.
export function Ripple({ rings = 6, size = 96, step = 56 }) {
  const ref = useRef(null);
  useVisible(ref, (v) => ref.current?.setAttribute("data-running", String(v)));
  return (
    <div className="ripple" ref={ref} aria-hidden="true">
      {Array.from({ length: rings }, (_, i) => {
        const d = size + i * step;
        return (
          <i
            key={i}
            className="ring"
            style={{ width: d, height: d, marginLeft: -d / 2, marginTop: -d / 2, animationDelay: `${i * 0.13}s`, opacity: 0.34 - i * 0.045 }}
          />
        );
      })}
    </div>
  );
}
