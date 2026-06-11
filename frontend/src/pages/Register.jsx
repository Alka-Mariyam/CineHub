import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { User as UserIcon, Mail, Phone, Lock, Home, Landmark, MapPin, PhoneCall, Gift } from 'lucide-react';
import { Container, Box, Typography, Button, TextField, Paper, InputAdornment, Checkbox, FormControlLabel, Tabs, Tab } from '@mui/material';
import { registerUser } from '../store';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [role, setRole] = useState('Customer'); // Customer or Manager

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    
    // Theatre fields
    theatreName: '',
    theatreCity: '',
    theatreState: '',
    theatreAddress: '',
    theatreContact: '',
    theatreFacilities: ''
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.acceptTerms) {
      setErrorMsg('You must accept the Terms & Conditions.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    
    const regPayload = {
      email: formData.email,
      full_name: formData.fullName,
      phone_number: formData.phoneNumber,
      password: formData.password,
      confirm_password: formData.confirmPassword,
      role: role,
      ...(role === 'Manager' && {
        theatre_name: formData.theatreName,
        theatre_city: formData.theatreCity,
        theatre_state: formData.theatreState,
        theatre_address: formData.theatreAddress,
        theatre_contact: formData.theatreContact,
        theatre_facilities: formData.theatreFacilities
      })
    };

    dispatch(registerUser(regPayload))
      .unwrap()
      .then(() => {
        if (role === 'Manager') {
          alert("Registration request submitted! Your account and Theatre are pending Admin approval.");
        } else {
          alert("Registration successful! Please login.");
        }
        navigate('/login');
      })
      .catch((err) => {
        setLoading(false);
        setErrorMsg(err.email?.[0] || err.phone_number?.[0] || err.password?.[0] || err.error || 'Registration failed.');
      });
  };

  return (
    <Box minHeight="90vh" display="flex" alignItems="center" justifyContent="center" position="relative" overflow="hidden" py={4}>
      {/* Background Decorative Glowing Blobs */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '15%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(229,9,20,0.15) 0%, rgba(229,9,20,0) 70%)',
          zIndex: 0
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          right: '15%',
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(250,204,21,0.1) 0%, rgba(250,204,21,0) 70%)',
          zIndex: 0
        }}
      />

      <Container maxWidth={role === 'Manager' ? 'sm' : 'xs'} style={{ position: 'relative', zIndex: 1 }}>
        <Paper p={4} className="glass-panel" style={{ padding: '36px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Box textAlign="center" mb={3}>
            <span style={{ fontSize: '36px' }}>🍿</span>
            <Typography variant="h4" fontWeight={900} mt={1} className="text-gradient">Join CineHub</Typography>
            <Typography variant="body2" color="textSecondary" mt={0.5}>Experience high quality cinema booking</Typography>
          </Box>

          <Tabs
            value={role}
            onChange={(e, newVal) => setRole(newVal)}
            centered
            textColor="primary"
            indicatorColor="primary"
            style={{ marginBottom: '24px' }}
          >
            <Tab label="Book Tickets" value="Customer" style={{ fontWeight: 800, textTransform: 'none' }} />
            <Tab label="Register Theatre" value="Manager" style={{ fontWeight: 800, textTransform: 'none' }} />
          </Tabs>

          <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap="16px">
            <Typography variant="subtitle2" fontWeight={800} color="primary" mb={-1}>Manager / User Credentials</Typography>
            <TextField
              fullWidth required
              label="Full Name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <UserIcon size={16} color="#EC4899" />
                  </InputAdornment>
                ),
                style: { background: 'rgba(22, 31, 48, 0.45)', color: '#FFFFFF', borderRadius: '8px' }
              }}
              InputLabelProps={{ style: { color: '#94A3B8' } }}
            />

            <TextField
              fullWidth required
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              label="Phone Number"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone size={16} color="#EC4899" />
                  </InputAdornment>
                ),
                style: { background: 'rgba(22, 31, 48, 0.45)', color: '#FFFFFF', borderRadius: '8px' }
              }}
              InputLabelProps={{ style: { color: '#94A3B8' } }}
            />

            <TextField
              fullWidth required
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

            <TextField
              fullWidth required
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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

            {/* Theatre manager extra details */}
            {role === 'Manager' && (
              <>
                <Typography variant="subtitle2" fontWeight={800} color="primary" mt={2} mb={-1}>Theatre Registration Details</Typography>
                <TextField
                  fullWidth required
                  label="Theatre / Multiplex Name"
                  placeholder="e.g. CineHub Multiplex"
                  value={formData.theatreName}
                  onChange={(e) => setFormData({ ...formData, theatreName: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Landmark size={16} color="#FACC15" />
                      </InputAdornment>
                    ),
                    style: { background: 'rgba(22, 31, 48, 0.45)', color: '#FFFFFF', borderRadius: '8px' }
                  }}
                  InputLabelProps={{ style: { color: '#94A3B8' } }}
                />

                <Box display="flex" gap="16px">
                  <TextField
                    fullWidth required
                    label="City"
                    placeholder="e.g. Mumbai"
                    value={formData.theatreCity}
                    onChange={(e) => setFormData({ ...formData, theatreCity: e.target.value })}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MapPin size={16} color="#FACC15" />
                        </InputAdornment>
                      ),
                      style: { background: 'rgba(22, 31, 48, 0.45)', color: '#FFFFFF', borderRadius: '8px' }
                    }}
                    InputLabelProps={{ style: { color: '#94A3B8' } }}
                  />

                  <TextField
                    fullWidth required
                    label="State"
                    placeholder="e.g. Maharashtra"
                    value={formData.theatreState}
                    onChange={(e) => setFormData({ ...formData, theatreState: e.target.value })}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MapPin size={16} color="#FACC15" />
                        </InputAdornment>
                      ),
                      style: { background: 'rgba(22, 31, 48, 0.45)', color: '#FFFFFF', borderRadius: '8px' }
                    }}
                    InputLabelProps={{ style: { color: '#94A3B8' } }}
                  />
                </Box>

                <TextField
                  fullWidth required
                  label="Detailed Street Address"
                  placeholder="Street details, landmarks"
                  value={formData.theatreAddress}
                  onChange={(e) => setFormData({ ...formData, theatreAddress: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Home size={16} color="#FACC15" />
                      </InputAdornment>
                    ),
                    style: { background: 'rgba(22, 31, 48, 0.45)', color: '#FFFFFF', borderRadius: '8px' }
                  }}
                  InputLabelProps={{ style: { color: '#94A3B8' } }}
                />

                <TextField
                  fullWidth required
                  label="Contact Phone / Email"
                  placeholder="theatre phone or email for enquiries"
                  value={formData.theatreContact}
                  onChange={(e) => setFormData({ ...formData, theatreContact: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneCall size={16} color="#FACC15" />
                      </InputAdornment>
                    ),
                    style: { background: 'rgba(22, 31, 48, 0.45)', color: '#FFFFFF', borderRadius: '8px' }
                  }}
                  InputLabelProps={{ style: { color: '#94A3B8' } }}
                />

                <TextField
                  fullWidth
                  label="Facilities (Comma separated)"
                  placeholder="e.g. Dolby Atmos, 3D, Recliner, IMAX"
                  value={formData.theatreFacilities}
                  onChange={(e) => setFormData({ ...formData, theatreFacilities: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Gift size={16} color="#FACC15" />
                      </InputAdornment>
                    ),
                    style: { background: 'rgba(22, 31, 48, 0.45)', color: '#FFFFFF', borderRadius: '8px' }
                  }}
                  InputLabelProps={{ style: { color: '#94A3B8' } }}
                />
              </>
            )}

            <FormControlLabel
              control={
                <Checkbox
                  color="secondary"
                  checked={formData.acceptTerms}
                  onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                  style={{ color: '#FACC15' }}
                />
              }
              label={
                <span style={{ fontSize: '13px', color: '#94A3B8' }}>
                  I accept the Terms & Conditions
                </span>
              }
            />

            {errorMsg && (
              <Typography variant="caption" color="error" style={{ textAlign: 'center' }}>
                {errorMsg}
              </Typography>
            )}

            <Button
              type="submit"
              variant="contained"
              className="bg-gradient-primary glow-pink"
              disabled={loading}
              style={{ padding: '12px', borderRadius: '8px', fontWeight: 900, marginTop: '10px', color: '#0B0F19' }}
            >
              {loading ? 'Submitting Registration...' : (role === 'Manager' ? 'Request Registration' : 'Create Account')}
            </Button>

            <Typography variant="body2" color="textSecondary" textAlign="center" mt={2}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#FACC15', textDecoration: 'none', fontWeight: 800 }}>
                Sign In
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;
