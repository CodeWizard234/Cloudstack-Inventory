import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Analytics from './pages/Analytics';
import Sales from './pages/Sales';

// Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Layout Wrapper to keep Sidebar/Navbar consistent across the dashboard
const RootLayout = () => (
  <div className="min-h-screen lg:flex">
    <Sidebar />
    <div className="flex-1 min-w-0 px-3 py-3 lg:p-4">
      <div className="glass-panel rounded-3xl min-h-[calc(100vh-2rem)] overflow-hidden">
      <Navbar />
      <main className="p-4 md:p-6 lg:p-8">
        <Outlet />
      </main>
      </div>
    </div>
  </div>
);

const App = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--brand)]"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <SignUp /> : <Navigate to="/" />} />
        <Route path="/reset-password" element={!user ? <ResetPassword /> : <Navigate to="/" />} />

        {/* Protected Application Routes */}
        <Route element={<ProtectedRoute isAuthenticated={!!user} />}>
          <Route path="/" element={<RootLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="/sales" element={<Sales />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;