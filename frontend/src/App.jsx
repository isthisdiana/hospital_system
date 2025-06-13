import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Register from "./Register";
import Login from "./Login";
import AdminDashboard from "./dashboards/AdminDashboard";
import NurseDashboard from "./dashboards/NurseDashboard";
import DoctorDashboard from "./dashboards/DoctorDashboard";
import BillingDashboard from "./dashboards/BillingDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/nurse" element={<NurseDashboard />} />
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/billing" element={<BillingDashboard />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;