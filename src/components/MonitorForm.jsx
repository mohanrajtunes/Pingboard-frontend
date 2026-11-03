import { useState } from "react";
import api, { errorMessage, fieldErrors } from "../lib/api";
import { Field, Modal } from "./ui";

const INTERVALS = [1, 5, 10, 15, 30, 60];

// One form for adding and editing a monitor.
export default function MonitorForm({ monitor, onClose, onSaved }) {
  const editing = Boolean(monitor);
  const [form, setForm] = useState({
    name: monitor?.name ?? "",
    url: monitor?.url ?? "",
    interval_minutes: monitor?.interval_minutes ?? 5,
    expected_status: monitor?.expected_status ?? 200,
    alerts_enabled: monitor?.alerts_enabled ?? true,
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setErrors({});
    setFormError("");
    setBusy(true);
    const body = {
      ...form,
      interval_minutes: Number(form.interval_minutes),
      expected_status: Number(form.expected_status),
    };
    try {
      const res = editing
        ? await api.patch(`/monitors/${monitor.id}/`, body)
        : await api.post("/monitors/", body);
      onSaved(res.data);
    } catch (err) {
      const fields = fieldErrors(err);
      const known = Object.keys(fields).filter((k) => k in form);
      if (known.length) setErrors(fields);
      else setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={editing ? "Edit monitor" : "Add a monitor"} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
        <Field label="Name" htmlFor="m-name" error={errors.name}>
          <input
            id="m-name"
            className="input"
            value={form.name}
            onChange={set("name")}
            placeholder="Shop"
            aria-invalid={Boolean(errors.name)}
            autoFocus
            required
          />
        </Field>
        <Field
          label="Address"
          htmlFor="m-url"
          error={errors.url || errors.non_field_errors}
          hint="A public http or https address."
        >
          <input
            id="m-url"
            className="input"
            value={form.url}
            onChange={set("url")}
            placeholder="https://example.com"
            inputMode="url"
            aria-invalid={Boolean(errors.url)}
            required
          />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Check every" htmlFor="m-int" error={errors.interval_minutes}>
            <select id="m-int" className="select" value={form.interval_minutes} onChange={set("interval_minutes")}>
              {INTERVALS.map((n) => (
                <option key={n} value={n}>
                  {n === 1 ? "1 minute" : `${n} minutes`}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Expected status" htmlFor="m-status" error={errors.expected_status}>
            <input
              id="m-status"
              className="input num"
              type="number"
              min="100"
              max="599"
              value={form.expected_status}
              onChange={set("expected_status")}
            />
          </Field>
        </div>
        <div className="field">
          <label className="check-row">
            <input type="checkbox" checked={form.alerts_enabled} onChange={set("alerts_enabled")} />
            Email me when it goes down or comes back
          </label>
        </div>
        <div className="dialog-actions">
          <button type="button" className="btn btn-line" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" disabled={busy}>
            {busy ? "Saving…" : editing ? "Save changes" : "Add monitor"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
