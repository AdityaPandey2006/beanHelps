import { Navigate, Route, Routes } from "react-router-dom";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/Dashboard";
import BeanerOnboarding from "../pages/BeanerOnboarding";
import TherapistOnboarding from "../pages/TherapistOnboarding";
import Home from "../pages/Home";
import TherapistHome from "../pages/TherapistHome";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/onboarding/beaner" element={<BeanerOnboarding />} />
      <Route path="/onboarding/therapist" element={<TherapistOnboarding />} />
      <Route path="/home" element={<Home />} />
      <Route path="/therapist/home" element={<TherapistHome />} />
    </Routes>
  );
};

export default AppRoutes;