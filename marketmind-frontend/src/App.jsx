import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NewIdea from './pages/NewIdea';
import IdeaDetail from './pages/IdeaDetail';
import AnalysisPage from './pages/AnalysisPage';
import CompetitorMap from './pages/CompetitorMap';
import PitchGenerator from './pages/PitchGenerator';
import StartupToolkit from './pages/StartupToolkit';
import MentorChat from './pages/MentorChat';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import Pricing from './pages/Pricing';
import NameGenerator from './pages/NameGenerator';
import FundingFinder from './pages/FundingFinder';
import RevenueCalculator from './pages/RevenueCalculator';
import MarketingPlan from './pages/MarketingPlan';
import LegalChecker from './pages/LegalChecker';
import AppLayout from './layouts/AppLayout';
import NotFound from './pages/NotFound';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#0a0a0f'}}><div className="spinner"/></div>;
  return user ? children : <Navigate to="/login" replace />;
}
function PublicRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ style: { background: '#1a1a2e', color: '#fff', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.3)' } }} />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>} />
          <Route path="/ideas/new" element={<PrivateRoute><AppLayout><NewIdea /></AppLayout></PrivateRoute>} />
          <Route path="/ideas/:id" element={<PrivateRoute><AppLayout><IdeaDetail /></AppLayout></PrivateRoute>} />
          <Route path="/ideas/:id/analysis" element={<PrivateRoute><AppLayout><AnalysisPage /></AppLayout></PrivateRoute>} />
          <Route path="/ideas/:id/competitors" element={<PrivateRoute><AppLayout><CompetitorMap /></AppLayout></PrivateRoute>} />
          <Route path="/ideas/:id/pitch" element={<PrivateRoute><AppLayout><PitchGenerator /></AppLayout></PrivateRoute>} />
          <Route path="/toolkit" element={<PrivateRoute><AppLayout><StartupToolkit /></AppLayout></PrivateRoute>} />
          <Route path="/mentor" element={<PrivateRoute><AppLayout><MentorChat /></AppLayout></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><AppLayout><Profile /></AppLayout></PrivateRoute>} />
          <Route path="/names" element={<PrivateRoute><AppLayout><NameGenerator /></AppLayout></PrivateRoute>} />
          <Route path="/funding" element={<PrivateRoute><AppLayout><FundingFinder /></AppLayout></PrivateRoute>} />
          <Route path="/revenue" element={<PrivateRoute><AppLayout><RevenueCalculator /></AppLayout></PrivateRoute>} />
          <Route path="/marketing" element={<PrivateRoute><AppLayout><MarketingPlan /></AppLayout></PrivateRoute>} />
          <Route path="/legal" element={<PrivateRoute><AppLayout><LegalChecker /></AppLayout></PrivateRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
