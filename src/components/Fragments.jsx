import { Link } from "react-router-dom";
import { Status, Strip, LineChart } from "./ui";

// Real pieces of the product, built from the same components as the app and
// shown at true size on the landing page. Everything here is example data for
// an imaginary shop; none of it is a customer or a claim.

export const checks = (n, failed = []) => Array.from({ length: n }, (_, i) => !failed.includes(i));

export function MonitorRows({ shopDown = false, compact = false }) {
  const rows = [
    {
      name: "Shop",
      host: "shop.example.dev",
      status: shopDown ? "down" : "up",
      checks: checks(60, shopDown ? [57, 58, 59] : []),
      uptime: shopDown ? "99.79%" : "100.00%",
    },
    { name: "Docs", host: "docs.example.dev", status: "up", checks: checks(60, [21]), uptime: "99.93%" },
    { name: "API", host: "api.example.dev", status: "up", checks: checks(60), uptime: "100.00%" },
  ].slice(0, compact ? 2 : 3);
  return (
    <div className="frag-rows" data-ui>
      {rows.map((r) => (
        <div className="frag-row" key={r.name}>
          <span className="who">
            <strong>{r.name}</strong>
            <span>{r.host}</span>
          </span>
          <Status status={r.status} />
          <span className="frag-strip">
            <Strip checks={r.checks} />
          </span>
          <span className="num frag-up">{r.uptime}</span>
        </div>
      ))}
    </div>
  );
}

export function AddMonitorCall() {
  return (
    <div className="frag-call" data-ui>
      <div className="frag-field">
        <span className="frag-label">Address</span>
        <span className="frag-input">https://shop.example.dev</span>
      </div>
      <div className="frag-line">
        <span className="frag-field">
          <span className="frag-label">Check every</span>
          <span className="frag-input">1 minute</span>
        </span>
        <span className="frag-btn">Add monitor</span>
      </div>
    </div>
  );
}

export function FailedChecksCall() {
  return (
    <div className="frag-call frag-log" data-ui>
      <div>
        <span className="num">12:41</span> Shop answered <strong className="bad">503</strong>, expected 200
      </div>
      <div>
        <span className="num">12:42</span> Shop answered <strong className="bad">503</strong>, expected 200
      </div>
    </div>
  );
}

export function IncidentOpened() {
  return (
    <div className="frag-card" data-ui>
      <span className="status status-down">
        <i className="dot dot-down" />
        Incident opened
      </span>
      <p>
        <strong>Shop</strong> failed two checks in a row, at 12:41 and 12:42. PingBoard emails you once.
      </p>
    </div>
  );
}

export function EmailCard({ kind = "down", wide = false }) {
  const down = kind === "down";
  return (
    <div className={`frag-email${wide ? " wide" : ""}`} data-ui>
      <div className="meta">
        <span className="muted">From</span> PingBoard
      </div>
      <div className="meta">
        <span className="muted">To</span> you
      </div>
      <div className="subject">{down ? "[DOWN] Shop is not responding" : "[UP] Shop is back online"}</div>
      <p>
        {down
          ? "Shop (https://shop.example.dev) failed 2 checks in a row."
          : "Shop (https://shop.example.dev) has recovered."}
      </p>
      <Link className="frag-open" to="/app">Open dashboard →</Link>
    </div>
  );
}

export function IntervalChips() {
  return (
    <div className="frag-chips" data-ui>
      {[1, 5, 10, 15, 30, 60].map((n) => (
        <span key={n} className={`chip${n === 1 ? " on" : ""}`}>
          {n} min
        </span>
      ))}
    </div>
  );
}

export function MissThenAlert() {
  return (
    <div className="frag-misses" data-ui>
      <div>
        <Strip checks={checks(30, [8])} size={30} label="One failed check, ignored" />
        <span>One miss. Nothing happens.</span>
      </div>
      <div>
        <Strip checks={checks(30, [20, 21])} size={30} label="Two failed checks, incident opened" />
        <span>Two misses. Incident opens.</span>
      </div>
    </div>
  );
}

export function IncidentsSlice() {
  const rows = [
    ["14 Oct, 03:12", "03:31", "19 min"],
    ["9 Oct, 22:04", "22:09", "5 min"],
    ["2 Oct, 11:48", "12:36", "48 min"],
  ];
  return (
    <div className="frag-table" data-ui>
      <div className="head">
        <span>Started</span>
        <span>Resolved</span>
        <span className="right">Duration</span>
      </div>
      {rows.map((r) => (
        <div className="frag-tr" key={r[0]}>
          <span className="num">{r[0]}</span>
          <span className="num">{r[1]}</span>
          <span className="num right">{r[2]}</span>
        </div>
      ))}
    </div>
  );
}

const hours = Array.from({ length: 24 }, (_, i) => {
  const t = new Date(Date.UTC(2026, 9, 14, i));
  const wave = 180 + Math.round(Math.sin(i / 2.2) * 34 + Math.cos(i * 1.3) * 12);
  return { t: t.toISOString(), v: i === 9 ? 640 : wave };
});

export function MiniChart() {
  return (
    <div className="frag-chart" data-ui>
      <div className="frag-chart-head">
        <span>Response time, 24 hours</span>
        <span className="num">212 ms average</span>
      </div>
      <LineChart points={hours} height={170} />
    </div>
  );
}

export function StatusSlice() {
  return (
    <div className="frag-status" data-ui>
      <div className="title">Example Co. status</div>
      <div className="line">
        <i className="dot dot-up" /> All systems are working.
      </div>
      {[
        ["Website", "100.00%"],
        ["Checkout", "99.98%"],
        ["API", "100.00%"],
      ].map(([n, u]) => (
        <div className="row" key={n}>
          <span>{n}</span>
          <span className="num">{u}</span>
        </div>
      ))}
    </div>
  );
}

export function RefusedAddress() {
  return (
    <div className="frag-refused" data-ui>
      <span className="frag-label">Address</span>
      <span className="frag-input bad-input">http://192.168.1.20/admin</span>
      <span className="field-error">That address points to a private or internal network.</span>
    </div>
  );
}
