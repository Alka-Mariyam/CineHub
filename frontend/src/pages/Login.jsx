import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { Container, Box, Typography, Button, TextField, Paper, InputAdornment } from '@mui/material';
import { loginUser, clearError } from '../store';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, error, loading, user } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role && ['Manager', 'Admin'].includes(user.role)) {
        navigate('/manager');
      } else {
        navigate('/set-location');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.removeItem('location_set');
    dispatch(loginUser({ email, password }));
  };

  return (
    <Box minHeight="85vh" display="flex" alignItems="center" justifyContent="center" position="relative" overflow="hidden">
      {/* Background Decorative Glowing Blobs */}
      <div
        style={{
          position: 'absolute',
          top: '25%',
          left: '20%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, rgba(236,72,153,0) 70%)',
          zIndex: 0
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '20%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(250,204,21,0.08) 0%, rgba(250,204,21,0) 70%)',
          zIndex: 0
        }}
      />

      <Container maxWidth="xs" style={{ position: 'relative', zIndex: 1 }}>
        <Paper p={4} className="glass-panel" style={{ padding: '36px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Box textAlign="center" mb={4}>
            <span style={{ fontSize: '38px' }}>🍿</span>
            <Typography variant="h4" fontWeight={900} mt={1} className="text-gradient">Welcome Back</Typography>
            <Typography variant="body2" color="textSecondary" mt={0.5}>Sign in to access CineHub tickets</Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap="20px">
            <TextField
              fullWidth
              required
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Mail size={16} color="#EC4899" />
                  </InputAdornment>
                ),
                style: { background: 'rgba(22, 31, 48, 0.45)', color: '#FFFFFF', borderRadius: '8px' }
              }}
              InputLabelProps={{ style: { color: '#94A3B8' } }}
            />

            <TextField
              fullWidth
              required
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock size={16} color="#EC4899" />
                  </InputAdornment>
                ),
                style: { background: 'rgba(22, 31, 48, 0.45)', color: '#FFFFFF', borderRadius: '8px' }
              }}
              InputLabelProps={{ style: { color: '#94A3B8' } }}
            />

            {error && (
              <Typography variant="caption" color="error" style={{ textAlign: 'center' }}>
                {typeof error === 'object' ? (error.detail || 'Invalid credentials') : error}
              </Typography>
            )}

            <Box textAlign="right" mt={-1}>
              <Link to="/forgot-password" style={{ color: '#FACC15', fontSize: '13px', textDecoration: 'none', fontWeight: 700 }}>
                Forgot Password?
              </Link>
            </Box>

            <Button
              type="submit"
              variant="contained"
              className="bg-gradient-primary glow-pink"
              disabled={loading}
              style={{ padding: '12px', borderRadius: '8px', fontWeight: 900, marginTop: '10px', color: '#0B0F19' }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>

            <Typography variant="body2" color="textSecondary" textAlign="center" mt={2}>
              New to CineHub?{' '}
              <Link to="/register" style={{ color: '#FACC15', textDecoration: 'none', fontWeight: 800 }}>
                Create Account
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
