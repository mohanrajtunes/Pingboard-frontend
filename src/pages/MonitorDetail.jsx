import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import MonitorForm from "../components/MonitorForm";
import { LineChart, Status } from "../components/ui";
import api, { errorMessage, unwrap } from "../lib/api";
import { ago, dateTime, duration, host, ms, pct } from "../lib/format";

const RANGES = [
  { key: "24h", label: "24 hours", hours: 24 },
  { key: "7d", label: "7 days", hours: 24 * 7 },
  { key: "30d", label: "30 days", hours: 24 * 30 },
];

export default function MonitorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [monitor, setMonitor] = useState(null);
  const [range, setRange] = useState("24h");
  const [stats, setStats] = useState(null);
  const [checks, setChecks] = useState(null);
  const [incidents, setIncidents] = useState(null);
  const [state, setState] = useState("loading"); // loading | ready | missing | error
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [checking, setChecking] = useState(false);
  const [notice, setNotice] = useState("");

  const loadAll = useCallback(async () => {
    try {
      const m = await api.get(`/monitors/${id}/`);
      setMonitor(m.data);
      const [c, i] = await Promise.all([api.get(`/monitors/${id}/checks/`), api.get(`/monitors/${id}/incidents/`)]);
      setChecks(unwrap(c.data));
      setIncidents(unwrap(i.data));
      setState("ready");
    } catch (err) {
      setState(err.response?.status === 404 ? "missing" : "error");
    }
  }, [id]);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get(`/monitors/${id}/stats/`, { params: { range } });
      setStats(res.data);
    } catch {
      setStats({ checks: 0, uptime_percent: null, avg_response_ms: null, buckets: [] });
    }
  }, [id, range]);

  useEffect(() => {
    loadAll();
    const timer = setInterval(() => !document.hidden && loadAll(), 30000);
    return () => clearInterval(timer);
  }, [loadAll]);

  useEffect(() => {
    setStats(null);
    loadStats();
  }, [loadStats]);

  const rangeInfo = RANGES.find((r) => r.key === range);
  const since = Date.now() - rangeInfo.hours * 3600 * 1000;

  const inRange = useMemo(
    () => (incidents || []).filter((i) => !i.resolved_at || new Date(i.resolved_at).getTime() >= since),
    [incidents, since]
  );
  const spans = useMemo(
    () =>
      inRange.map((i) => ({
        from: new Date(i.started_at).getTime(),
        to: i.resolved_at ? new Date(i.resolved_at).getTime() : Date.now(),
      })),
    [inRange]
  );
  const points = useMemo(
    () => (stats?.buckets || []).map((b) => ({ t: b.time, v: b.avg_response_ms })),
    [stats]
  );
  const open = (incidents || []).find((i) => !i.resolved_at);

  async function checkNow() {
    setChecking(true);
    setNotice("");
    try {
      await api.post(`/monitors/${id}/check_now/`);
      setNotice("Check queued. Results appear in a few seconds.");
      setTimeout(() => {
        loadAll();
        loadStats();
        setChecking(false);
      }, 2500);
    } catch (err) {
      setNotice(errorMessage(err, "Couldn't start a check."));
      setChecking(false);
    }
  }

  async function remove() {
    try {
      await api.delete(`/monitors/${id}/`);
      navigate("/app");
    } catch (err) {
      setNotice(errorMessage(err, "Couldn't delete this monitor."));
      setConfirmDelete(false);
    }
  }

  if (state === "missing")
    return (
      <div className="page">
        <Link className="crumb" to="/app">
          Monitors
        </Link>
        <div className="page-head">
          <div>
            <h1>Monitor not found</h1>
            <p className="finding">It may have been deleted. Go back to your list.</p>
          </div>
        </div>
      </div>
    );

  if (state === "error")
    return (
      <div className="page">
        <Link className="crumb" to="/app">
          Monitors
        </Link>
        <p className="error-block">
          Couldn't load this monitor.
          <button className="btn-text" onClick={loadAll}>
            Retry
          </button>
        </p>
      </div>
    );

  if (!monitor)
    return (
      <div className="page" aria-busy="true">
        <Link className="crumb" to="/app">
          Monitors
        </Link>
        <div className="page-head">
          <div>
            <span className="skeleton" style={{ width: 180, height: 28 }} />
          </div>
        </div>
      </div>
    );

  const finding = open
    ? `Since ${dateTime(open.started_at)}, ${duration((Date.now() - new Date(open.started_at)) / 1000)} so far.`
    : monitor.status === "up"
    ? `Last checked ${ago(monitor.last_checked_at).toLowerCase()}.`
    : "Waiting for the first check.";

  return (
    <div className="page">
      <Link className="crumb" to="/app">
        Monitors
      </Link>
      <div className="page-head">
        <div>
          <h1>{monitor.name}</h1>
          <p className="sub">
            <a href={monitor.url} target="_blank" rel="noreferrer noopener" style={{ textUnderlineOffset: 3 }}>
              {host(monitor.url)}
            </a>
            {" · every "}
            {monitor.interval_minutes} min · expects {monitor.expected_status}
          </p>
          <p className={`finding${open ? " alert" : ""}`} style={{ marginTop: 10 }} aria-live="polite">
            <Status status={monitor.status} /> <span style={{ marginLeft: 8 }}>{finding}</span>
          </p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={checkNow} disabled={checking}>
            {checking ? "Checking…" : "Check now"}
          </button>
          <button className="btn btn-secondary" onClick={() => setEditing(true)}>
            Edit
          </button>
          {confirmDelete ? (
            <>
              <button className="btn btn-danger" onClick={remove}>
                Delete for good
              </button>
              <button className="btn btn-line" onClick={() => setConfirmDelete(false)}>
                Keep
              </button>
            </>
          ) : (
            <button className="btn btn-line" onClick={() => setConfirmDelete(true)}>
              Delete
            </button>
          )}
        </div>
      </div>
      {notice && (
        <p className="sub" role="status" style={{ marginTop: -12, marginBottom: 16 }}>
          {notice}
        </p>
      )}

      <div className="kpis">
        <div className="kpi">
          <div className="label">Uptime, {rangeInfo.label}</div>
          <div className="value num">{stats ? pct(stats.uptime_percent) : "–"}</div>
        </div>
        <div className="kpi">
          <div className="label">Average response</div>
          <div className="value num">{stats ? ms(stats.avg_response_ms) : "–"}</div>
        </div>
        <div className="kpi">
          <div className="label">Checks</div>
          <div className="value num">{stats ? stats.checks.toLocaleString("en") : "–"}</div>
        </div>
        <div className="kpi">
          <div className="label">Incidents</div>
          <div className={`value num${inRange.length ? " alert" : ""}`}>{incidents ? inRange.length : "–"}</div>
        </div>
      </div>

      <div className="section">
        <div className="panel chart-card">
          <div className="head">
            <h2>Response time</h2>
            <div className="tabs" role="tablist" aria-label="Range">
              {RANGES.map((r) => (
                <button
                  key={r.key}
                  role="tab"
                  className="tab"
                  aria-selected={range === r.key}
                  onClick={() => setRange(r.key)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          {stats ? (
            <LineChart points={points} spans={spans} />
          ) : (
            <div className="chart-empty" style={{ height: 240 }} aria-busy="true">
              Loading…
            </div>
          )}
          {spans.length > 0 && <p className="hint" style={{ marginTop: 8 }}>Shaded areas are incidents.</p>}
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <h2>Incidents</h2>
        </div>
        <div className="panel">
          {incidents && incidents.length === 0 ? (
            <div className="empty-block">No incidents yet. One opens after two failed checks in a row.</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Started</th>
                    <th>Resolved</th>
                    <th className="right">Duration</th>
                    <th className="hide-phone">Cause</th>
                  </tr>
                </thead>
                <tbody>
                  {(incidents || []).slice(0, 8).map((i) => (
                    <tr key={i.id}>
                      <td className="num">{dateTime(i.started_at)}</td>
                      <td className="num">
                        {i.resolved_at ? dateTime(i.resolved_at) : <span className="alert">Ongoing</span>}
                      </td>
                      <td className="right num">
                        {i.resolved_at ? duration(i.duration_seconds) : <span className="dash">–</span>}
                      </td>
                      <td className="hide-phone muted">{i.cause || "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <h2>Recent checks</h2>
          <span className="meta">Newest first</span>
        </div>
        <div className="panel">
          {checks && checks.length === 0 ? (
            <div className="empty-block">No checks yet. The first one runs within a minute.</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Result</th>
                    <th className="right">Status code</th>
                    <th className="right">Response</th>
                    <th className="hide-phone">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {(checks || []).slice(0, 12).map((c) => (
                    <tr key={c.id}>
                      <td className="num">{dateTime(c.checked_at)}</td>
                      <td>{c.ok ? "Passed" : <span className="alert">Failed</span>}</td>
                      <td className="right num">{c.status_code ?? <span className="dash">–</span>}</td>
                      <td className="right num">{c.response_ms != null ? ms(c.response_ms) : <span className="dash">–</span>}</td>
                      <td className="hide-phone muted" style={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {c.error || "–"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editing && (
        <MonitorForm
          monitor={monitor}
          onClose={() => setEditing(false)}
          onSaved={(m) => {
            setEditing(false);
            setMonitor(m);
            loadAll();
          }}
        />
      )}
    </div>
  );
}
