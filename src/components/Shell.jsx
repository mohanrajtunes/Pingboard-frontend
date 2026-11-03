import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { setMode } from "../lib/theme";
import "../app.css";

// The mark is the thing PingBoard watches: a pulse line.
export function Pulse() {
  return (
    <svg viewBox="0 0 28 18" aria-hidden="true">
      <path
        d="M1 10h6l3.5-8 5 15 3.5-9 2 2h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Brand({ to = "/app" }) {
  return (
    <Link to={to} className="brand" aria-label="PingBoard home">
      <Pulse />
      <span>PingBoard</span>
    </Link>
  );
}

const icons = {
  monitors: (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M1.5 8.5h3l2-5 3 9 2-4h3" />
    </svg>
  ),
  home: (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2 7.5 8 2.5l6 5M3.5 6.5V13.5h9V6.5" />
    </svg>
  ),
  status: (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <rect x="2" y="2.5" width="12" height="11" rx="1.5" />
      <path d="M2 6h12M5 9h6" />
    </svg>
  ),
};

export default function Shell() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [location.pathname]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app">
      <header className="topbar">
        <Brand to="/" />
        <ModeSwitch />
        <button className="btn-text" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="sidebar">
          {open ? "Close" : "Menu"}
        </button>
      </header>
      <aside className={`sidebar${open ? " open" : ""}`} id="sidebar">
        <div className="side-top">
          <Brand to="/" />
          <ModeSwitch />
        </div>
        <div className="scope">
          Workspace
          <strong>{user.username}</strong>
        </div>
        <nav className="nav" aria-label="Main">
          <NavLink to="/app" end>
            {icons.monitors}
            Monitors
          </NavLink>
          <NavLink to="/app/status-page">
            {icons.status}
            Status page
          </NavLink>
          <Link to="/">
            {icons.home}
            Homepage
          </Link>
        </nav>
        <div className="sidebar-foot">
          <span className="who">{user.email || user.username}</span>
          <button
            className="btn-text"
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="canvas">
        <Outlet />
      </main>
    </div>
  );
}

function ModeSwitch() {
  const [mode, setM] = useState(() => document.documentElement.dataset.mode || "dark");
  const next = mode === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      className="mode-switch"
      aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => {
        setMode(next);
        setM(next);
      }}
    >
      {mode === "dark" ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
      )}
    </button>
  );
}
