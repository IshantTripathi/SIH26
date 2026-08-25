import React, { useState, Component } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { DemoScenarioModal } from './components/demo/DemoScenarioModal';
import { AiChatWidget } from './components/common/AiChatWidget';

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Something went wrong</h2>
          <p className="text-sm text-slate-500 mb-4">{this.state.error.message}</p>
          <button onClick={() => { this.setState({ error: null }); window.location.reload(); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            Reload Page
          </button>
        </div>
      </div>
    );
    return this.props.children;
  }
}

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { BookingHistoryPage } from './pages/customer/BookingHistoryPage';
import { WorkerDashboard } from './pages/worker/WorkerDashboard';
import { WorkerEarningsPage } from './pages/worker/WorkerEarningsPage';
import { WorkerWelfarePage } from './pages/worker/WorkerWelfarePage';
import { WorkerApplicationPage } from './pages/worker/WorkerApplicationPage';
import { WorkerUtilizationPage } from './pages/worker/WorkerUtilizationPage';
import { SkillPassportPage } from './pages/worker/SkillPassportPage';
import { WellnessPage } from './pages/worker/WellnessPage';
import { DividendPage } from './pages/worker/DividendPage';
import { GovernancePage } from './pages/society/GovernancePage';
import { SocietyDashboard } from './pages/society/SocietyDashboard';
import { SocietyWorkersPage } from './pages/society/SocietyWorkersPage';
import { SocietyComplaintsPage } from './pages/society/SocietyComplaintsPage';
import { FederationDashboard } from './pages/federation/FederationDashboard';
import { PlatformAdminPage } from './pages/admin/PlatformAdminPage';
import { VoiceBookingPage } from './pages/customer/VoiceBookingPage';
import { CommunityImpactPage } from './pages/CommunityImpactPage';
import HousehelpPage from './pages/customer/HousehelpPage';
import BeautySpaPage from './pages/customer/BeautySpaPage';
import ManicurePedicurePage from './pages/customer/ManicurePedicurePage';
import ProfilePage from './pages/customer/ProfilePage';

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
        <ErrorBoundary>
        <Routes>
          <Route path="/" element={<LandingPage onOpenDemoScenarios={() => setDemoModalOpen(true)} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Customer Routes */}
          <Route path="/customer" element={<CustomerDashboard />} />
          <Route path="/customer/bookings" element={<BookingHistoryPage />} />
          <Route path="/customer/voice-book" element={<VoiceBookingPage />} />
          <Route path="/customer/househelp" element={<HousehelpPage />} />
          <Route path="/customer/beauty-spa" element={<BeautySpaPage />} />
          <Route path="/customer/manicure-pedicure" element={<ManicurePedicurePage />} />
          <Route path="/customer/profile" element={<ProfilePage />} />

          {/* Worker Routes */}
          <Route path="/worker" element={<WorkerDashboard />} />
          <Route path="/worker/earnings" element={<WorkerEarningsPage />} />
          <Route path="/worker/welfare" element={<WorkerWelfarePage />} />
          <Route path="/worker/apply" element={<WorkerApplicationPage />} />
          <Route path="/worker/utilization" element={<WorkerUtilizationPage />} />
          <Route path="/worker/passport" element={<SkillPassportPage />} />
          <Route path="/worker/wellness" element={<WellnessPage />} />
          <Route path="/worker/dividend" element={<DividendPage />} />

          {/* Society Admin Routes */}
          <Route path="/society" element={<SocietyDashboard />} />
          <Route path="/society/workers" element={<SocietyWorkersPage />} />
          <Route path="/society/complaints" element={<SocietyComplaintsPage />} />
          <Route path="/society/governance" element={<GovernancePage />} />

          {/* Federation Admin Routes */}
          <Route path="/federation" element={<FederationDashboard />} />

          {/* Platform Admin Routes */}
          <Route path="/admin" element={<PlatformAdminPage />} />

          {/* Community Impact */}
          <Route path="/impact" element={<CommunityImpactPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </ErrorBoundary>
      </main>

      <Footer />

      {/* Global SIH Hackathon Demo Walkthrough Modal */}
      <DemoScenarioModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
      />

      {/* Global AI Assistant Floating Widget */}
      <AiChatWidget />
    </div>
  );
}
export default App;
