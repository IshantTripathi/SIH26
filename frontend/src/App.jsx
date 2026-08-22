import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { DemoScenarioModal } from './components/demo/DemoScenarioModal';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { BookingHistoryPage } from './pages/customer/BookingHistoryPage';
import { WorkerDashboard } from './pages/worker/WorkerDashboard';
import { WorkerEarningsPage } from './pages/worker/WorkerEarningsPage';
import { WorkerWelfarePage } from './pages/worker/WorkerWelfarePage';
import { SocietyDashboard } from './pages/society/SocietyDashboard';
import { SocietyWorkersPage } from './pages/society/SocietyWorkersPage';
import { SocietyComplaintsPage } from './pages/society/SocietyComplaintsPage';
import { FederationDashboard } from './pages/federation/FederationDashboard';
import { PlatformAdminPage } from './pages/admin/PlatformAdminPage';

export function App() {
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 text-sm">
        <div className="space-y-2 text-center">
          <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-semibold text-slate-800">Initializing Cooperative Services Infrastructure...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar onOpenDemoScenarios={() => setDemoModalOpen(true)} />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage onOpenDemoScenarios={() => setDemoModalOpen(true)} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Customer Routes */}
          <Route path="/customer" element={<CustomerDashboard />} />
          <Route path="/customer/bookings" element={<BookingHistoryPage />} />

          {/* Worker Routes */}
          <Route path="/worker" element={<WorkerDashboard />} />
          <Route path="/worker/earnings" element={<WorkerEarningsPage />} />
          <Route path="/worker/welfare" element={<WorkerWelfarePage />} />

          {/* Society Admin Routes */}
          <Route path="/society" element={<SocietyDashboard />} />
          <Route path="/society/workers" element={<SocietyWorkersPage />} />
          <Route path="/society/complaints" element={<SocietyComplaintsPage />} />

          {/* Federation Admin Routes */}
          <Route path="/federation" element={<FederationDashboard />} />

          {/* Platform Admin Routes */}
          <Route path="/admin" element={<PlatformAdminPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />

      {/* Global SIH Hackathon Demo Walkthrough Modal */}
      <DemoScenarioModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
      />
    </div>
  );
}
export default App;
