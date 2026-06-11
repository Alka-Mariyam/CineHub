import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Container, Box, Typography, Button, TextField, Paper, InputAdornment } from '@mui/material';
import { API } from '../store';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get('email') || '';
  const token = queryParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    API.post('/auth/reset-password/', {
      email,
      token,
      password,
      confirm_password: confirmPassword
    })
      .then((res) => {
        setMessage(res.data.message);
        setLoading(false);
      })
      .catch((err) => {
        setErrorMsg(err.response?.data?.error || 'Failed to reset password.');
        setLoading(false);
      });
  };

  return (
    <Container maxWidth="xs" style={{ marginTop: '80px' }}>
      <Paper p={4} className="glass-panel" style={{ padding: '32px' }}>
        <Box textAlign="center" mb={3}>
          <Typography variant="h4" fontWeight={800} className="text-gradient">Choose New Password</Typography>
          <Typography variant="body2" color="textSecondary" mt={0.5}>Enter your new security credentials</Typography>
        </Box>

        {message ? (
          <Box textAlign="center" py={2}>
            <span style={{ fontSize: '36px' }}>✅</span>
            <Typography variant="body1" mt={2} style={{ color: '#10B981', fontWeight: 600 }}>{message}</Typography>
            <Button variant="contained" className="bg-gradient-primary" fullWidth onClick={() => navigate('/login')} style={{ marginTop: '20px', borderRadius: '8px' }}>
              Go to Login
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap="20px">
            <TextField
              fullWidth
              required
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock size={16} color="#94A3B8" />
                  </InputAdornment>
                ),
                style: { background: 'rgba(15, 23, 42, 0.4)', color: '#FFFFFF', borderRadius: '8px' }
              }}
              InputLabelProps={{ style: { color: '#94A3B8' } }}
            />

            <TextField
              fullWidth
              required
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock size={16} color="#94A3B8" />
                  </InputAdornment>
                ),
                style: { background: 'rgba(15, 23, 42, 0.4)', color: '#FFFFFF', borderRadius: '8px' }
              }}
              InputLabelProps={{ style: { color: '#94A3B8' } }}
            />

            {errorMsg && (
              <Typography variant="caption" color="error">
                {errorMsg}
              </Typography>
            )}

            <Button
              type="submit"
              variant="contained"
              className="bg-gradient-primary glow-purple"
              disabled={loading}
              style={{ padding: '12px', borderRadius: '8px', fontWeight: 800 }}
            >
              {loading ? 'Resetting...' : 'Update Password'}
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ResetPassword;
