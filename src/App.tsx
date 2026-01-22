import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import { LoginPage } from "./pages/auth/LoginPage";
import { ActivationPage } from "./pages/auth/ActivationPage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import './App.css'

import { OnboardingLayout } from "./pages/onboarding/OnboardingLayout";

function Home() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/activate/:token" element={<ActivationPage />} />
      <Route path="/onboarding/*" element={<OnboardingLayout />} />
      
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
    </Routes>
  )
}

export default App
