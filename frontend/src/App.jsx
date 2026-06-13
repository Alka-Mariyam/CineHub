import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@mui/material';

// Import components
import Header from './components/Header';
import Footer from './components/Footer';

// Import pages
import Dashboard from './pages/Dashboard';
import MovieDetails from './pages/MovieDetails';
import BookingPage from './pages/BookingPage';
import CheckoutPage from './pages/CheckoutPage';
import GroupBookingPage from './pages/GroupBookingPage';
import ProfilePage from './pages/ProfilePage';
// Admin and Manager dashboards removed for revert
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import LocationDetection from './pages/LocationDetection';
import PaymentSuccess from './pages/PaymentSuccess';
import BookingConfirmed from './pages/BookingConfirmed.jsx';

import { fetchUserProfile } from './store';

// Location guard: redirects to /set-location if location not set
const RequireLocation = ({ children }) => {
  const locationSet = localStorage.getItem('location_set');
  const loc = useLocation();
  if (!locationSet) {
    return <Navigate to="/set-location" state={{ from: loc }} replace />;
  }
  return children;
};

// Manager guard: redirects to home if user is not manager/admin
const RequireManager = ({ children }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const loc = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: loc }} replace />;
  }
  if (user && !['Manager', 'Admin'].includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Layout wrapper that hides header/footer on location page
const AppLayout = () => {
  const location = useLocation();
  const hideChrome = location.pathname === '/set-location';

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh" style={{ background: '#0F172A' }}>
      {!hideChrome && <Header />}
      <Box flex={1}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/set-location" element={<LocationDetection />} />

          {/* Protected by location */}
          <Route path="/" element={<RequireLocation><Dashboard /></RequireLocation>} />
          
          {/* Adaptable Detail screens */}
          <Route path="/movie/:id" element={<RequireLocation><MovieDetails type="movie" /></RequireLocation>} />
          <Route path="/event/:id" element={<RequireLocation><MovieDetails type="event" /></RequireLocation>} />
          <Route path="/sports/:id" element={<RequireLocation><MovieDetails type="sports" /></RequireLocation>} />
          
          {/* Booking & Group selector */}
          <Route path="/booking/:type/:id" element={<RequireLocation><BookingPage /></RequireLocation>} />
          <Route path="/checkout/:bookingId" element={<RequireLocation><CheckoutPage /></RequireLocation>} />

          <Route path="/payment-success/:bookingId" element={<RequireLocation><PaymentSuccess /></RequireLocation>} />
          <Route path="/booking-confirmed/:bookingId" element={<RequireLocation><BookingConfirmed /></RequireLocation>} />
          <Route path="/group-booking/:inviteCode" element={<RequireLocation><GroupBookingPage /></RequireLocation>} />
          
          {/* User Profiles */}
          <Route path="/profile" element={<RequireLocation><ProfilePage /></RequireLocation>} />
          
          {/* Theatre Admin Dashboard */}
          <Route path="/manager" element={<RequireLocation><RequireManager><ManagerDashboard /></RequireManager></RequireLocation>} />
        </Routes>
      </Box>
      {!hideChrome && <Footer />}
    </Box>
  );
};

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Attempt auto-login if token is present
    const token = localStorage.getItem('access_token');
    if (token) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch]);

  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
