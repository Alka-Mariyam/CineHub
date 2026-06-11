import React, { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { Container, Box, Typography, Button, TextField, Paper, InputAdornment } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { API } from '../store';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');
    setErrorMsg('');
    setLoading(true);

    API.post('/auth/forgot-password/', { email })
      .then((res) => {
        setMessage(res.data.message);
        setLoading(false);
      })
      .catch((err) => {
        setErrorMsg(err.response?.data?.error || 'Failed to request password reset.');
        setLoading(false);
      });
  };

  return (
    <Container maxWidth="xs" style={{ marginTop: '80px' }}>
      <Paper p={4} className="glass-panel" style={{ padding: '32px' }}>
        <Box display="flex" alignItems="center" gap="6px" mb={2}>
          <Link to="/login" style={{ color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={16} />
          </Link>
          <Typography variant="body2" color="textSecondary">Back to login</Typography>
        </Box>

        <Box textAlign="center" mb={3}>
          <Typography variant="h4" fontWeight={800} className="text-gradient">Reset Password</Typography>
          <Typography variant="body2" color="textSecondary" mt={0.5}>Enter your email to receive recovery instructions</Typography>
        </Box>

        {message ? (
          <Box textAlign="center" py={2}>
            <span style={{ fontSize: '36px' }}>✉️</span>
            <Typography variant="body1" mt={2} style={{ color: '#10B981', fontWeight: 600 }}>{message}</Typography>
            <Button variant="outlined" color="primary" fullWidth onClick={() => navigate('/login')} style={{ marginTop: '20px', borderRadius: '8px' }}>
              Go to Login
            </Button>
          </Box>
        ) : (
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
                    <Mail size={16} color="#94A3B8" />
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
              {loading ? 'Sending...' : 'Send Recovery Link'}
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ForgotPassword;
