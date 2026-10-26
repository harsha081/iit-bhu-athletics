import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/navbar";
import Home from "./pages/Home";
import Athletes from "./pages/Athletes";
import Events from "./pages/Events";
import SportsMeets from "./pages/SportsMeets";
import Alumni from "./pages/Alumni";
import AlumniLeadership from "./pages/AlumniLeadership";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AddAthlete from "./pages/AddAthlete";

import SportsFestManagement from "./pages/SportsFestManagement";
import PerformanceManagement from "./pages/PerformanceManagement";
import LeadershipManagement from "./pages/LeadershipManagement";

import CoachesManagement from "./pages/CoachesManagement";
import Coaches from "./pages/Coaches";

import AnnouncementsManagement from "./pages/AnnouncementsManagement";
import MissionCountdownManagement from "./pages/MissionCountdownManagement";
import Updates from "./pages/Updates";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <ScrollToTop />

      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Home />} />
        <Route path="/athletes" element={<Athletes />} />
        <Route path="/events" element={<Events />} />
        <Route path="/sports-meets" element={<SportsMeets />} />
        <Route path="/alumni" element={<Alumni />} />
        <Route
          path="/alumni-leadership"
          element={<AlumniLeadership />}
        />
        <Route path="/coaches" element={<Coaches />} />
        <Route path="/updates" element={<Updates />} />

        {/* Admin pages */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route
          path="/admin/athletes/new"
          element={<AddAthlete />}
        />
        <Route
          path="/admin/athletes/edit/:id"
          element={<AddAthlete />}
        />
        <Route
          path="/admin/sports-fests"
          element={<SportsFestManagement />}
        />
        <Route
          path="/admin/performances"
          element={<PerformanceManagement />}
        />
        <Route
          path="/admin/leadership"
          element={<LeadershipManagement />}
        />
        <Route
          path="/admin/coaches"
          element={<CoachesManagement />}
        />
        <Route
          path="/admin/announcements"
          element={<AnnouncementsManagement />}
        />
        <Route
          path="/admin/mission-countdown"
          element={<MissionCountdownManagement />}
        />

        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
