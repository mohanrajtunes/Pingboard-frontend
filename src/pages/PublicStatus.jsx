import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Pulse } from "../components/Shell";
import { Status, StatusDot } from "../components/ui";
import api from "../lib/api";
import { pct } from "../lib/format";
import "../app.css";

export default function PublicStatus() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [state, setState] = useState("loading");
  const [updated, setUpdated] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      api
        .get(`/public/status/${slug}/`)
        .then((res) => {
          if (!alive) return;
          setData(res.data);
          setState("ready");
          setUpdated(new Date());
        })
        .catch((err) => alive && setState(err.response?.status === 404 ? "missing" : "error"));
    load();
    const timer = setInterval(() => !document.hidden && load(), 30000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [slug]);

  document.title = data?.title ? `${data.title} · PingBoard` : "Status · PingBoard";

  if (state === "missing")
    return (
      <div className="public">
        <div className="public-col">
          <h1>This status page doesn't exist</h1>
          <p className="overall muted">Check the link, or ask whoever shared it.</p>
        </div>
      </div>
    );

  if (state === "error")
    return (
      <div className="public">
        <div className="public-col">
          <h1>Status unavailable</h1>
          <p className="overall muted">We couldn't load this page just now. Try again in a minute.</p>
        </div>
      </div>
    );

  if (!data)
    return (
      <div className="public" aria-busy="true">
        <div className="public-col">
          <span className="skeleton" style={{ width: 220, height: 32 }} />
        </div>
      </div>
    );

  const list = data.monitors || [];
  const down = list.filter((m) => m.status === "down");
  const allUp = list.length > 0 && list.every((m) => m.status === "up");
  let line = "No monitors are listed yet.";
  let tone = "unknown";
  if (down.length) {
    tone = "down";
    line = down.length === list.length ? "Everything is down." : `${down.length} of ${list.length} systems are down.`;
  } else if (allUp) {
    tone = "up";
    line = "All systems are working.";
  } else if (list.length) line = "Waiting for the first checks.";

  return (
    <div className="public">
      <div className="public-col">
        <h1>{data.title}</h1>
        <p className={`overall${tone === "down" ? " alert" : ""}`} aria-live="polite">
          <StatusDot status={tone} />
          {line}
        </p>
        <div className="public-list">
          {list.map((m) => (
            <div className="public-row" key={m.name}>
              <span className="n">{m.name}</span>
              <Status status={m.status} />
              <span className="num">{m.uptime_24h != null ? pct(m.uptime_24h) : "–"}</span>
              <span className="u">
                {m.uptime_24h != null ? "Uptime over the last 24 hours" : "No checks in the last 24 hours"}
                {m.uptime_30d != null ? ` · ${pct(m.uptime_30d)} over 30 days` : ""}
              </span>
            </div>
          ))}
        </div>
        <div className="public-foot">
          <span>
            {updated ? `Updated ${updated.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : ""}
          </span>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 22, display: "inline-block" }}>
              <Pulse />
            </span>
            Monitored by PingBoard
          </Link>
        </div>
      </div>
    </div>
  );
}
