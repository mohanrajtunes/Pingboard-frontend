import { Fragment, lazy, Suspense, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Link } from "react-router-dom";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Pulse } from "../components/Shell";
import { Strip } from "../components/ui";
import { EmailCard } from "../components/Fragments";
import MarkStill from "../components/MarkStill";
import { useAuth } from "../lib/auth";
import { loadTheme, setMode } from "../lib/theme";
import "../landing.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const LiquidMark = lazy(() => import("../components/LiquidMark"));

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function useWebGL() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (reduced()) return;
    try {
      const c = document.createElement("canvas");
      setOk(!!(c.getContext("webgl2") || c.getContext("webgl")));
    } catch {
      setOk(false);
    }
  }, []);
  return ok;
}

/* Mount the WebGL logo only when its section is close, so the shader never competes with the intro. */
function useNear(selector, root) {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = root.current?.querySelector(selector);
    if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setNear(true), io.disconnect()), { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [selector, root]);
  return near;
}

const FEATURES = [
  { stat: "1 min", title: "Checks every minute", body: "Or every 5, 10, 15, 30 or 60. Redirects are followed; a check that takes over 10 seconds counts as a miss." },
  { stat: "2 misses", title: "A blip is not an outage", body: "One failed check is ignored. Two in a row open an incident. The next good check closes it on its own." },
  { stat: "start → end", title: "Every incident has a timeline", body: "When it broke, when it came back and how long it really lasted." },
  { stat: "24h · 7d · 30d", title: "Uptime and response time", body: "A chart for every monitor, with the outages marked on the line." },
  { stat: "1 link", title: "A public status page", body: "Share what's up and what's down, never the addresses behind it." },
  { stat: "0 private IPs", title: "Only public addresses", body: "Private and internal addresses are refused, so nobody can point a monitor at your own network." },
];

const TICKER = [
  ["shop.example.dev", 200, 182],
  ["api.example.dev", 200, 96],
  ["blog.example.dev", 200, 241],
  ["status.example.dev", 200, 74],
  ["shop.example.dev", 503, 0],
  ["docs.example.dev", 200, 133],
];

/* Words for headings: each word sits in a mask so it can rise into place. */
function Split({ text }) {
  return text.split(" ").map((w, i) => (
    <Fragment key={i}>
      <span className="w">
        <span>{w}</span>
      </span>{" "}
    </Fragment>
  ));
}
const chars = (t) => t.split("").map((c, i) => <span className="ch" key={i}>{c === " " ? "\u00a0" : c}</span>);

const pad = (n) => String(n).padStart(2, "0");
const clock = (m) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;

export default function Landing() {
  const root = useRef(null);
  const { user } = useAuth();
  const webgl = useWebGL();
  const near = useNear(".cta", root);
  const [mode, setModeState] = useState(() => (typeof document !== "undefined" ? loadTheme() : "light"));

  useEffect(() => {
    if (reduced()) return undefined;
    const lenis = new Lenis({ lerp: 0.1, anchors: true });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: reduce)", () => root.current.classList.add("ready"));
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Build the intro paused, so its first frame is set before paint, then play it
        // once the fonts are in: no flash of fallback type, no jump mid-animation.
        const intro = gsap
          .timeline({ paused: true, defaults: { ease: "power4.out", force3D: true } })
          .from(".hero-h .ch, .hero-h .lw", { yPercent: 115, duration: 1, stagger: 0.03 })
          .from(".beat", { opacity: 0, duration: 1, ease: "power2.out" }, 0.35)
          .from("[data-nav] > *", { y: -12, opacity: 0, duration: 0.6, stagger: 0.06 }, 0.2)
          .from(".hero-foot > *", { y: 18, opacity: 0, duration: 0.7, stagger: 0.08 }, 0.55);
        root.current.classList.add("ready");
        let started = false;
        const start = () => {
          if (started) return;
          started = true;
          requestAnimationFrame(() => requestAnimationFrame(() => intro.play()));
        };
        const fonts = document.fonts
          ? Promise.all([
              document.fonts.load('760 100px "Bricolage Grotesque Variable"'),
              document.fonts.load('500 14px "JetBrains Mono Variable"'),
            ])
          : Promise.resolve();
        fonts.then(start, start);
        document.fonts?.ready.then(() => ScrollTrigger.refresh());
        const fallback = setTimeout(start, 900);
        const cleanupIntro = () => clearTimeout(fallback);

        gsap.to(".hero-h", {
          yPercent: -12,
          ease: "none",
          scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
        });

        gsap.set("[data-reveal]", { opacity: 0, y: 30 });
        ScrollTrigger.batch("[data-reveal]", {
          start: "top 88%",
          once: true,
          onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.07, overwrite: true }),
        });

        gsap.to(".progress", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

        gsap.utils.toArray("[data-split]").forEach((h) =>
          gsap.from(h.querySelectorAll(".w > span"), {
            yPercent: 110,
            duration: 0.9,
            ease: "power4.out",
            stagger: 0.06,
            scrollTrigger: { trigger: h, start: "top 85%" },
          })
        );

        gsap.fromTo(
          ".alerts-mail .frag-email",
          { rotate: -7, y: 90 },
          { rotate: 0, y: 0, ease: "none", scrollTrigger: { trigger: ".alerts", start: "top bottom", end: "center center", scrub: 0.6 } }
        );
        gsap.fromTo(
          ".alerts-mail",
          { "--tilt": "-4deg" },
          { "--tilt": "4deg", ease: "none", scrollTrigger: { trigger: ".alerts", start: "top bottom", end: "bottom top", scrub: 0.6 } }
        );

        gsap.fromTo(
          ".console",
          { scale: 0.92 },
          { scale: 1, ease: "none", scrollTrigger: { trigger: ".console", start: "top bottom", end: "top 30%", scrub: true } }
        );

        gsap.from(".wordmark span", {
          yPercent: 100,
          ease: "none",
          stagger: 0.04,
          scrollTrigger: { trigger: ".foot", start: "top bottom", end: "bottom bottom", scrub: true },
        });

        if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
          const offs = [];
          gsap.utils.toArray(".mag").forEach((el) => {
            const qx = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
            const qy = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
            const move = (e) => {
              const r = el.getBoundingClientRect();
              qx((e.clientX - r.left - r.width / 2) * 0.3);
              qy((e.clientY - r.top - r.height / 2) * 0.4);
            };
            const leave = () => {
              qx(0);
              qy(0);
            };
            el.addEventListener("pointermove", move);
            el.addEventListener("pointerleave", leave);
            offs.push(() => {
              el.removeEventListener("pointermove", move);
              el.removeEventListener("pointerleave", leave);
            });
          });
          return () => {
            cleanupIntro();
            offs.forEach((f) => f());
          };
        }
        return cleanupIntro;
      });
      return undefined;
    },
    { scope: root }
  );

  return (
    <div className="l" ref={root}>
      <div className="progress" aria-hidden="true" />
      <section className="hero" aria-labelledby="hero-title">
        <header className="wrap topnav" data-nav>
          <Link to="/" className="logo" aria-label="PingBoard home">
            <Pulse />
            <span>PingBoard</span>
          </Link>
          <nav className="nav-links" aria-label="Main">
            <a href="#console">Live demo</a>
            <a href="#features">Features</a>
            <a href="#alerts">Alerts</a>
          </nav>
          <div className="nav-end">
            <button
              type="button"
              className="mode"
              aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              onClick={(e) => {
                const next = mode === "dark" ? "light" : "dark";
                const apply = () => {
                  setMode(next);
                  setModeState(next);
                };
                if (!document.startViewTransition || reduced()) return apply();
                const r = e.currentTarget.getBoundingClientRect();
                const x = r.left + r.width / 2;
                const y = r.top + r.height / 2;
                const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
                document.startViewTransition(() => flushSync(apply)).ready.then(() =>
                  document.documentElement.animate(
                    { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
                    { duration: 650, easing: "cubic-bezier(0.77, 0, 0.175, 1)", pseudoElement: "::view-transition-new(root)" }
                  )
                );
              }}
            >
              {mode === "dark" ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
              )}
            </button>
            <Link to={user ? "/app" : "/login"} className="btn btn-ink">
              {user ? "Dashboard" : "Sign in"}
            </Link>
          </div>
        </header>

        <div className="wrap hero-body">
          <h1 id="hero-title" className="hero-h" aria-label="Your site is up.">
            <span className="hero-line" aria-hidden="true"><span>{chars("Your site")}</span></span>
            <span className="hero-line" aria-hidden="true"><span>{chars("is ")}<LiveWord /><span className="ch">.</span></span></span>
          </h1>
          <div className="hero-foot">
            <p className="hero-sub">
              PingBoard checks it every minute and emails you after two misses in a row. One email, not a hundred.
            </p>
            <div className="hero-cta">
              <Link className="btn btn-volt mag" to="/register">Start monitoring, free</Link>
              <a className="btn btn-line mag" href="#console">Break a site</a>
            </div>
          </div>
        </div>

        <Heartbeat />
      </section>

      <main>
        <Console />

        <section className="sec wrap" id="features" aria-labelledby="feat-title">
          <h2 id="feat-title" className="h2" data-split><Split text="Small on purpose." /></h2>
          <dl className="rows">
            {FEATURES.map((f) => (
              <div className="row" key={f.title} data-reveal>
                <dt>{f.title}</dt>
                <dd>{f.body}</dd>
                <dd className="row-stat">{f.stat}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="sec wrap alerts" id="alerts" aria-labelledby="alerts-title">
          <div className="alerts-copy">
            <h2 id="alerts-title" className="h2" data-split><Split text="Two misses, then one email." /></h2>
            <ol className="timeline">
              <li data-reveal><time>12:41</time><p><strong>First miss.</strong> Shop answers 503. PingBoard writes it down and waits.</p></li>
              <li data-reveal><time>12:42</time><p><strong>Second miss.</strong> Two in a row, so an incident opens.</p></li>
              <li data-reveal><time>12:42</time><p><strong>One email.</strong> To you, with the time and the cause. Another when it's back.</p></li>
            </ol>
          </div>
          <div className="alerts-mail" data-reveal>
            <EmailCard wide />
          </div>
        </section>

        <section className="sec cta" aria-labelledby="cta-title">
          <div className="wrap cta-grid">
            <div className="cta-mark" aria-hidden="true">
              {webgl && near ? (
                <Suspense fallback={<MarkStill />}>
                  <LiquidMark size={420} />
                </Suspense>
              ) : (
                <MarkStill />
              )}
            </div>
            <div>
              <h2 id="cta-title" className="cta-h" data-split><Split text="Sleep through the blips." /></h2>
              <p className="cta-sub" data-reveal>Add your first site in under a minute. No card, no setup call.</p>
              <div className="hero-cta" data-reveal>
                <Link className="btn btn-volt mag" to="/register">Create an account</Link>
                <Link className="btn btn-line mag" to="/login">Sign in</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap foot-row">
          <span>PingBoard · uptime monitoring</span>
          <nav aria-label="Footer">
            <Link to="/login">Sign in</Link>
            <Link to="/register">Create account</Link>
            <a href="https://github.com/mohanrajtunes/pingboard-backend">Source on GitHub</a>
          </nav>
          <span>Built by Mohanraj S</span>
        </div>
        <div className="wordmark" aria-hidden="true">
          {"PingBoard".split("").map((ch, i) => (
            <span key={i}>{ch}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}

/* A full-width heartbeat: steady beats, one missed pair in coral, scrolling forever. */
function Heartbeat() {
  const beat = (x) => `L${x} 60 L${x + 14} 60 L${x + 22} 18 L${x + 32} 104 L${x + 42} 40 L${x + 50} 60 L${x + 120} 60`;
  let d = "M0 60";
  for (let i = 0; i < 12; i += 1) d += " " + (i === 7 || i === 8 ? `M${i * 120 + 120} 60` : beat(i * 120));
  const flat = "M846 60 L1074 60";
  return (
    <div className="beat" aria-hidden="true">
      <svg className="beat-track" viewBox="0 0 2880 120" width="2880" height="120">
        {[0, 1440].map((o) => (
          <g key={o} transform={`translate(${o} 0)`}>
            <path className="beat-line" d={d} />
            <path className="beat-miss" d={flat} />
          </g>
        ))}
      </svg>
      <div className="beat-scan" />
    </div>
  );
}

/* The headline's last word is live: "up", until a pretend outage turns it "down" for a moment. */
function LiveWord() {
  const [down, setDown] = useState(false);
  useEffect(() => {
    if (reduced()) return undefined;
    let t;
    const loop = (isDown) => {
      t = setTimeout(() => {
        setDown(!isDown);
        loop(!isDown);
      }, isDown ? 2200 : 6500);
    };
    loop(false);
    return () => clearTimeout(t);
  }, []);
  return (
    <span key={down ? "d" : "u"} className={`lw${down ? " down" : ""}`}>
      {down ? "down" : "up"}
    </span>
  );
}

/* A pretend monitor: one check per second stands for one minute. Break it and watch the log. */
function Console() {
  const START = 12 * 60 + 30;
  const seed = Array.from({ length: 8 }, (_, i) => ({ id: i, kind: "ok", at: START + i, ms: 150 + ((i * 47) % 90) }));
  const [lines, setLines] = useState(seed);
  const [broken, setBroken] = useState(false);
  const [flash, setFlash] = useState(false);
  const [checks, setChecks] = useState(() => seed.map(() => true));
  const sim = useRef({ minute: START + 8, streak: 0, open: false, openedAt: 0, id: 8, broken: false, ms: seed.map((s) => s.ms) });
  const visible = useRef(false);
  const node = useRef(null);
  const logRef = useRef(null);

  useEffect(() => {
    sim.current.broken = broken;
  }, [broken]);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => (visible.current = e.isIntersecting), { threshold: 0.15 });
    if (node.current) io.observe(node.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const step = () => {
      const s = sim.current;
      const at = s.minute++;
      const out = [];
      if (s.broken) {
        s.streak += 1;
        out.push({ id: s.id++, kind: "bad", at, ms: 0 });
        if (s.streak === 2 && !s.open) {
          s.open = true;
          s.openedAt = at - 1;
          out.push({ id: s.id++, kind: "sys", at, text: "INCIDENT OPENED · email sent to you" });
          setFlash(true);
        }
      } else {
        const ms = 120 + Math.round(Math.random() * 140);
        s.ms.push(ms);
        s.streak = 0;
        out.push({ id: s.id++, kind: "ok", at, ms });
        if (s.open) {
          s.open = false;
          out.push({ id: s.id++, kind: "sys ok", at, text: `RESOLVED · down ${at - s.openedAt} min · email sent` });
        }
      }
      setChecks((c) => [...c, !s.broken].slice(-120));
      setLines((l) => [...l, ...out].slice(-40));
    };
    const id = setInterval(() => {
      if (visible.current && !document.hidden && !reduced()) step();
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const total = checks.length;
  const failed = checks.filter((c) => !c).length;
  const uptime = ((100 * (total - failed)) / total).toFixed(2);
  const okMs = sim.current.ms.slice(-30);
  const avg = Math.round(okMs.reduce((a, b) => a + b, 0) / okMs.length);
  const down = broken && sim.current.streak >= 2;

  return (
    <section className="sec wrap" id="console" aria-labelledby="console-title" ref={node}>
      <div className="console-head">
        <h2 id="console-title" className="h2" data-split><Split text="Every minute, written down." /></h2>
        <p className="muted" data-reveal>A pretend shop, checked once a second here. Break it and watch what PingBoard does.</p>
      </div>
      <div className={`console${flash ? " flash" : ""}`} onAnimationEnd={(e) => e.target === e.currentTarget && setFlash(false)}>
        <div className="console-bar">
          <span className={`pill-status${down ? " is-down" : ""}`}><i />{down ? "Down" : "Up"}</span>
          <span className="mono dim">shop.example.dev · every 1 min</span>
          <button type="button" className={`btn ${broken ? "btn-volt" : "btn-coral"}`} onClick={() => setBroken((b) => !b)} aria-pressed={broken}>
            {broken ? "Fix the site" : "Break the site"}
          </button>
        </div>
        <div className="console-body">
          <ol className="log mono" ref={logRef} aria-live="polite" aria-label="Check log">
            {lines.map((l) => (
              <li key={l.id} className={l.kind}>
                <time>{clock(l.at)}:00</time>
                {l.text ? (
                  <span>{l.text}</span>
                ) : l.kind === "ok" ? (
                  <span><em>200</em> · {l.ms} ms</span>
                ) : (
                  <span><em>503</em> · no answer</span>
                )}
              </li>
            ))}
          </ol>
          <dl className="stats">
            <div><dt>Uptime</dt><dd className="mono">{uptime}%</dd></div>
            <div><dt>Avg response</dt><dd className="mono">{avg} ms</dd></div>
            <div><dt>Checks</dt><dd className="mono">{total}</dd></div>
            <div className="stats-strip"><dt>Last 40 checks</dt><dd><Strip checks={checks} size={40} /></dd></div>
          </dl>
        </div>
      </div>
    </section>
  );
}
