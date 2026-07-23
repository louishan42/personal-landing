import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import SetupProfile from "./pages/SetupProfile";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Explore from "./pages/Explore";
import Create from "./pages/Create";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import MomentDetail from "./pages/MomentDetail";
import Timeline from "./pages/Timeline";
import LifeMap from "./pages/LifeMap";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/setup-profile"
          element={
            <ProtectedRoute>
              <SetupProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/create" element={<Create />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/u/:username" element={<UserProfile />} />
                  <Route path="/moment/:id" element={<MomentDetail />} />
                  <Route path="/timeline" element={<Timeline />} />
                  <Route path="/map" element={<LifeMap />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
