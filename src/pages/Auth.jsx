import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Brand } from "../components/Shell";
import { Field } from "../components/ui";
import { errorMessage, fieldErrors } from "../lib/api";
import { useAuth } from "../lib/auth";
import "../app.css";

function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const { user, loading, login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/app" replace />;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setErrors({});
    setFormError("");
    setBusy(true);
    try {
      if (isRegister) await register(form.username, form.email, form.password);
      else await login(form.username, form.password);
      navigate("/app");
    } catch (err) {
      const fields = fieldErrors(err);
      if (Object.keys(fields).length && isRegister) setErrors(fields);
      else
        setFormError(
          err.response?.status === 401
            ? "That username and password don't match."
            : errorMessage(err)
        );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <Brand to="/" />
      <form className="auth-card" onSubmit={submit} noValidate>
        <h1>{isRegister ? "Create your account" : "Sign in"}</h1>
        <p className="lede">
          {isRegister
            ? "Add a site in under a minute. We only write when something breaks."
            : "Welcome back. Your monitors kept running while you were away."}
        </p>
        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
        <Field label="Username" htmlFor="username" error={errors.username}>
          <input
            id="username"
            className="input"
            value={form.username}
            onChange={set("username")}
            autoComplete="username"
            aria-invalid={Boolean(errors.username)}
            required
          />
        </Field>
        {isRegister && (
          <Field
            label="Email"
            htmlFor="email"
            error={errors.email}
            hint="Alerts are sent here."
          >
            <input
              id="email"
              type="email"
              className="input"
              value={form.email}
              onChange={set("email")}
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              required
            />
          </Field>
        )}
        <Field label="Password" htmlFor="password" error={errors.password}>
          <input
            id="password"
            type="password"
            className="input"
            value={form.password}
            onChange={set("password")}
            autoComplete={isRegister ? "new-password" : "current-password"}
            aria-invalid={Boolean(errors.password)}
            required
          />
        </Field>
        <button className="btn" disabled={busy}>
          {busy ? "One moment…" : isRegister ? "Create account" : "Sign in"}
        </button>
        <p className="auth-alt">
          {isRegister ? (
            <>
              Already have an account? <Link to="/login">Sign in</Link>
            </>
          ) : (
            <>
              New here? <Link to="/register">Create an account</Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}

export const Login = () => <AuthPage mode="login" />;
export const Register = () => <AuthPage mode="register" />;
