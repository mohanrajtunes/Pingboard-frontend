import { useEffect, useState } from "react";
import { Field } from "../components/ui";
import api, { errorMessage, fieldErrors, unwrap } from "../lib/api";
import { host } from "../lib/format";

export default function StatusPageSettings() {
  const [monitors, setMonitors] = useState(null);
  const [form, setForm] = useState({ slug: "", title: "", monitors: [] });
  const [exists, setExists] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = unwrap((await api.get("/monitors/")).data);
        setMonitors(list);
        try {
          const { data } = await api.get("/status-page/");
          if (data.slug) {
            setExists(true);
            setForm({ slug: data.slug, title: data.title, monitors: data.monitors || [] });
          }
        } catch (err) {
          if (err.response?.status !== 404) throw err;
        }
      } catch (err) {
        setFormError(errorMessage(err, "Couldn't load your status page."));
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const toggle = (id) =>
    setForm((f) => ({
      ...f,
      monitors: f.monitors.includes(id) ? f.monitors.filter((m) => m !== id) : [...f.monitors, id],
    }));

  async function save(e) {
    e.preventDefault();
    setErrors({});
    setFormError("");
    setSaved("");
    setBusy(true);
    try {
      const { data } = await api.put("/status-page/", {
        slug: form.slug.trim().toLowerCase(),
        title: form.title.trim(),
        monitors: form.monitors,
      });
      setForm({ slug: data.slug, title: data.title, monitors: data.monitors || [] });
      setExists(true);
      setSaved("Saved.");
    } catch (err) {
      const fields = fieldErrors(err);
      if (Object.keys(fields).some((k) => ["slug", "title", "monitors"].includes(k))) setErrors(fields);
      else setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const publicUrl = `${window.location.origin}/s/${form.slug}`;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Status page</h1>
          <p className="finding">
            {exists
              ? "Your page is live. Anyone with the link can see it."
              : "Share one link that shows whether your sites are up."}
          </p>
        </div>
        {exists && (
          <div className="page-actions">
            <a className="btn btn-secondary" href={`/s/${form.slug}`} target="_blank" rel="noreferrer noopener">
              Open page
            </a>
          </div>
        )}
      </div>

      <form className="panel" onSubmit={save} noValidate>
        {formError && (
          <p className="form-error" role="alert" style={{ margin: 24 }}>
            {formError}
          </p>
        )}
        <div className="settings-row">
          <div>
            <h3>Address</h3>
            <p className="desc">Letters, numbers and dashes. This is the link you share.</p>
          </div>
          <div>
            <Field label="Page address" htmlFor="sp-slug" error={errors.slug}>
              <div className="slug-input">
                <span className="prefix">{window.location.host}/s/</span>
                <input
                  id="sp-slug"
                  className="input"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="my-company"
                  aria-invalid={Boolean(errors.slug)}
                />
              </div>
            </Field>
            {exists && (
              <p className="hint" style={{ marginTop: -6 }}>
                {publicUrl}
              </p>
            )}
          </div>
        </div>
        <div className="settings-row">
          <div>
            <h3>Title</h3>
            <p className="desc">Shown at the top of the page.</p>
          </div>
          <Field label="Page title" htmlFor="sp-title" error={errors.title}>
            <input
              id="sp-title"
              className="input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="My Company status"
              aria-invalid={Boolean(errors.title)}
            />
          </Field>
        </div>
        <div className="settings-row">
          <div>
            <h3>Monitors on the page</h3>
            <p className="desc">Visitors see names, status and uptime. The addresses stay private.</p>
          </div>
          <div>
            {!loaded && <span className="skeleton" style={{ width: 200 }} />}
            {loaded && monitors && monitors.length === 0 && (
              <p className="muted">You have no monitors yet. Add one on the Monitors screen first.</p>
            )}
            {monitors && monitors.length > 0 && (
              <div className="pick-list">
                {monitors.map((m) => (
                  <label className="check-row" key={m.id}>
                    <input type="checkbox" checked={form.monitors.includes(m.id)} onChange={() => toggle(m.id)} />
                    <span>
                      {m.name}
                      <span className="url">{host(m.url)}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
            {errors.monitors && <p className="field-error">{errors.monitors}</p>}
          </div>
        </div>
        <div className="actions-bar">
          {saved && (
            <span className="saved" role="status">
              {saved}
            </span>
          )}
          <button className="btn" disabled={busy || !form.slug || !form.title}>
            {busy ? "Saving…" : exists ? "Save changes" : "Publish page"}
          </button>
        </div>
      </form>
    </div>
  );
}
