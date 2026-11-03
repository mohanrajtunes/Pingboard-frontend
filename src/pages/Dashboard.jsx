import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MonitorForm from "../components/MonitorForm";
import { Status, Strip } from "../components/ui";
import api, { unwrap } from "../lib/api";
import { ago, dateTime, duration, host, ms, pct } from "../lib/format";

const STRIP = 50;

// Everything one monitor row needs: the monitor, its last 60 checks (oldest
// first) and its 24 hour stats.
async function loadRow(monitor) {
  const [checks, stats, incidents] = await Promise.allSettled([
    api.get(`/monitors/${monitor.id}/checks/`),
    api.get(`/monitors/${monitor.id}/stats/`, { params: { range: "24h" } }),
    api.get(`/monitors/${monitor.id}/incidents/`),
  ]);
  return {
    ...monitor,
    checks: checks.status === "fulfilled" ? unwrap(checks.value.data).slice(0, STRIP).reverse() : [],
    stats: stats.status === "fulfilled" ? stats.value.data : null,
    incidents: incidents.status === "fulfilled" ? unwrap(incidents.value.data).slice(0, 5) : [],
  };
}

// How many of the newest checks failed in a row.
const failedStreak = (checks) => {
  let n = 0;
  for (let i = checks.length - 1; i >= 0 && !checks[i].ok; i -= 1) n += 1;
  return n;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(false);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = unwrap((await api.get("/monitors/")).data);
      setRows(await Promise.all(list.map(loadRow)));
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(() => !document.hidden && load(), 30000);
    return () => clearInterval(timer);
  }, [load]);

  // Totals are computed from the rows as shown.
  const totals = useMemo(() => {
    if (!rows) return null;
    const active = rows.filter((r) => r.is_active !== false);
    const up = active.filter((r) => r.status === "up").length;
    const down = active.filter((r) => r.status === "down");
    let checks = 0;
    let good = 0;
    let weighted = 0;
    active.forEach((r) => {
      const n = r.stats?.checks || 0;
      if (!n) return;
      const ok = Math.round((n * (r.stats.uptime_percent ?? 0)) / 100);
      checks += n;
      good += ok;
      weighted += (r.stats.avg_response_ms || 0) * ok;
    });
    return {
      total: active.length,
      up,
      down,
      checks,
      failed: checks - good,
      uptime: checks ? (good / checks) * 100 : null,
      response: good ? weighted / good : null,
      lastChecked: active.map((r) => r.last_checked_at).filter(Boolean).sort().pop(),
    };
  }, [rows]);

  const latest = useMemo(
    () =>
      (rows || [])
        .flatMap((r) => (r.incidents || []).map((i) => ({ ...i, monitor: r })))
        .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))
        .slice(0, 5),
    [rows]
  );

  let finding = "";
  let alert = false;
  if (!rows) finding = "Loading your monitors…";
  else if (!rows.length) finding = "Nothing is being watched yet.";
  else if (totals.down.length) {
    alert = true;
    const first = totals.down[0];
    const streak = failedStreak(first.checks);
    finding =
      totals.down.length === 1
        ? `${first.name} is down${streak ? `: the last ${streak} check${streak === 1 ? "" : "s"} failed` : ""}.`
        : `${totals.down.length} monitors are down, starting with ${first.name}.`;
  } else if (totals.up === totals.total) {
    finding = `All ${totals.total} monitor${totals.total === 1 ? " is" : "s are"} up. Last check ${ago(totals.lastChecked).toLowerCase()}.`;
  } else finding = "Waiting for the first checks to come in.";

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Monitors</h1>
          <p className={`finding${alert ? " alert" : ""}`} aria-live="polite">
            {finding}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => setAdding(true)}>
            Add monitor
          </button>
        </div>
      </div>

      <div className="kpis" aria-label="Last 24 hours">
        <div className="kpi">
          <div className="label">Up now</div>
          <div className="value num">
            {totals ? totals.up : "–"}
            <small>{totals ? `of ${totals.total}` : ""}</small>
          </div>
        </div>
        <div className="kpi">
          <div className="label">Uptime, 24 hours</div>
          <div className="value num">{totals ? pct(totals.uptime) : "–"}</div>
        </div>
        <div className="kpi">
          <div className="label">Average response</div>
          <div className="value num">{totals ? ms(totals.response) : "–"}</div>
        </div>
        <div className="kpi">
          <div className="label">Failed checks, 24 hours</div>
          <div className={`value num${totals?.failed ? " alert" : ""}`}>
            {totals ? totals.failed.toLocaleString("en") : "–"}
            <small>{totals ? `of ${totals.checks.toLocaleString("en")}` : ""}</small>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <h2>All monitors</h2>
          {rows && rows.length > 0 && <span className="meta">Refreshes every 30 seconds</span>}
        </div>
        <div className="panel">
          {error && (
            <p className="error-block">
              Couldn't load your monitors.
              <button className="btn-text" onClick={load}>
                Retry
              </button>
            </p>
          )}
          {!error && !rows && <SkeletonRows />}
          {!error && rows && rows.length === 0 && (
            <div className="empty-block">
              <strong>Add the first address you want to watch</strong>
              <span>PingBoard checks it on a schedule and emails you after two failed checks in a row.</span>
              <button className="btn" onClick={() => setAdding(true)}>
                Add monitor
              </button>
            </div>
          )}
          {!error && rows && rows.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Monitor</th>
                    <th>Status</th>
                    <th className="hide-phone">Recent checks</th>
                    <th className="right">Uptime, 24 h</th>
                    <th className="right hide-phone">Response</th>
                    <th className="right hide-phone">Checked</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      className="clickable"
                      onClick={() => navigate(`/app/monitors/${r.id}`)}
                    >
                      <td>
                        <a
                          className="row-link"
                          href={`/app/monitors/${r.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate(`/app/monitors/${r.id}`);
                          }}
                        >
                          <span className="name">{r.name}</span>
                          <span className="url">{host(r.url)}</span>
                        </a>
                      </td>
                      <td>{r.is_active === false ? <span className="muted">Paused</span> : <Status status={r.status} />}</td>
                      <td className="hide-phone">
                        <Strip checks={r.checks.map((c) => c.ok)} size={STRIP} />
                      </td>
                      <td className="right num">
                        {r.stats?.checks ? pct(r.stats.uptime_percent) : <span className="dash">–</span>}
                      </td>
                      <td className="right num hide-phone">
                        {r.stats?.avg_response_ms ? ms(r.stats.avg_response_ms) : <span className="dash">–</span>}
                      </td>
                      <td className="right hide-phone muted">{ago(r.last_checked_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {rows && rows.length > 0 && (
        <div className="section">
          <div className="section-head">
            <h2>Latest incidents</h2>
            <span className="meta">Across all monitors</span>
          </div>
          <div className="panel">
            {latest.length === 0 ? (
              <div className="empty-block">No incidents yet. One opens after two failed checks in a row.</div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Monitor</th>
                      <th>Started</th>
                      <th>Resolved</th>
                      <th className="right">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latest.map((i) => (
                      <tr key={`${i.monitor.id}-${i.id}`} className="clickable" onClick={() => navigate(`/app/monitors/${i.monitor.id}`)}>
                        <td>
                          <span className="name">{i.monitor.name}</span>
                        </td>
                        <td className="num">{dateTime(i.started_at)}</td>
                        <td className="num">
                          {i.resolved_at ? dateTime(i.resolved_at) : <span className="alert">Ongoing</span>}
                        </td>
                        <td className="right num">
                          {i.resolved_at ? duration(i.duration_seconds) : <span className="dash">–</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {adding && (
        <MonitorForm
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="table-wrap" aria-busy="true" aria-label="Loading monitors">
      <table className="table">
        <tbody>
          {[0, 1, 2].map((i) => (
            <tr key={i}>
              <td>
                <span className="skeleton" style={{ width: 120 }} />
              </td>
              <td>
                <span className="skeleton" style={{ width: 48 }} />
              </td>
              <td className="hide-phone">
                <span className="skeleton" style={{ width: 300, height: 22 }} />
              </td>
              <td className="right">
                <span className="skeleton" style={{ width: 56 }} />
              </td>
              <td className="right hide-phone">
                <span className="skeleton" style={{ width: 64 }} />
              </td>
              <td className="right hide-phone">
                <span className="skeleton" style={{ width: 56 }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
