import { Navigate, Route, Routes, useParams } from "react-router-dom";
import Shell from "./components/Shell";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import { Login, Register } from "./pages/Auth";
import MonitorDetail from "./pages/MonitorDetail";
import PublicStatus from "./pages/PublicStatus";
import StatusPageSettings from "./pages/StatusPageSettings";

// Alert emails link to /monitors/:id, so send those links to the app.
function MonitorRedirect() {
  const { id } = useParams();
  return <Navigate to={`/app/monitors/${id}`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/s/:slug" element={<PublicStatus />} />
      <Route path="/monitors/:id" element={<MonitorRedirect />} />
      <Route path="/app" element={<Shell />}>
        <Route index element={<Dashboard />} />
        <Route path="monitors/:id" element={<MonitorDetail />} />
        <Route path="status-page" element={<StatusPageSettings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
