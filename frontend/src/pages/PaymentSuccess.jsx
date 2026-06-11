import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Grid, Box, Typography, Button, Paper, Divider, CircularProgress, Alert } from '@mui/material';
import { Mail, ChevronRight, Calendar, Clock, MapPin, Armchair, Ticket, CheckCircle2, QrCode } from 'lucide-react';
import { motion } from 'framer-motion';
import { API, fetchUserProfile } from '../store';

const PaymentSuccess = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const fetchBooking = async () => {
    try {
      const res = await API.get(`/bookings/${bookingId}/`);
      setBooking(res.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load booking details');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
    dispatch(fetchUserProfile());
  }, [bookingId]);

  const resendEmail = async () => {
    try {
      await API.post(`/resend-email/${bookingId}/`);
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 4000);
    } catch (err) {
      setError('Failed to resend email');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh" flexDirection="column" gap="16px">
        <CircularProgress style={{ color: '#EC4899' }} />
        <Typography variant="h6" color="textSecondary">Finalizing your ticket details...</Typography>
      </Box>
    );
  }

  if (error || !booking) {
    return (
      <Container maxWidth="sm" style={{ marginTop: '80px' }}>
        <Paper className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <Alert severity="error" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#FCA5A5', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error || 'Failed to load ticket details.'}
          </Alert>
          <Button variant="contained" className="bg-gradient-primary" onClick={() => navigate('/')} style={{ color: '#0B0F19', fontWeight: 800, marginTop: '24px' }}>
            Go Back Home
          </Button>
        </Paper>
      </Container>
    );
  }

  const show = booking.show_detail;
  const showTitle = show?.movie_detail?.title || show?.event_title || show?.sports_title || 'Entertainment Ticket';
  const poster = show?.movie_detail?.poster || show?.event_banner || show?.sports_banner;
  const language = show?.movie_detail?.language;
  const category = show?.movie_detail ? 'Movie' : (show?.event_title ? 'Event' : 'Sport');
  const locationName = show?.theatre_detail?.name || show?.venue_name || 'CineHub Location';
  const dateStr = show?.start_time ? new Date(show.start_time).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const timeStr = show?.start_time ? new Date(show.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <Container maxWidth="md" style={{ marginTop: '40px', marginBottom: '80px' }}>
      <Box display="flex" flexDirection="column" alignItems="center" gap="24px">
        
        {/* Animated Celebration Icon */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 10, stiffness: 100 }}
        >
          <Box display="flex" flexDirection="column" alignItems="center" gap="8px">
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '2px solid #10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
            }}>
              <CheckCircle2 size={40} color="#10B981" />
            </div>
            <Typography variant="h4" fontWeight={900} className="text-gradient" mt={1}>
              Booking Confirmed!
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Your payment was processed successfully. Have a great show!
            </Typography>
          </Box>
        </motion.div>

        {/* Premium Digital Entry Ticket Card */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ width: '100%', maxWidth: '600px' }}
        >
          <Paper 
            className="glass-panel" 
            style={{ 
              position: 'relative',
              borderRadius: '24px', 
              overflow: 'hidden',
              border: '2px solid rgba(16, 185, 129, 0.4)',
              boxShadow: '0 10px 40px rgba(16, 185, 129, 0.1)'
            }}
          >
            {/* Header strip */}
            <Box 
              p={1.5} 
              textAlign="center" 
              style={{ 
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                borderBottom: '1px solid rgba(16, 185, 129, 0.2)'
              }}
            >
              <Typography variant="subtitle2" fontWeight={900} style={{ letterSpacing: '3px', fontSize: '11px' }}>
                DIGITAL ENTRY PASS
              </Typography>
            </Box>

            <Grid container>
              {/* Poster section */}
              {poster && (
                <Grid item xs={12} sm={4}>
                  <Box style={{ height: '100%', minHeight: '220px', position: 'relative' }}>
                    <img 
                      src={poster} 
                      alt={showTitle} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    {language && (
                      <Box 
                        position="absolute" 
                        top="12px" 
                        left="12px" 
                        style={{ background: '#EC4899', color: '#0B0F19', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 900 }}
                      >
                        {language}
                      </Box>
                    )}
                  </Box>
                </Grid>
              )}

              {/* Show Details Section */}
              <Grid item xs={12} sm={poster ? 8 : 12}>
                <Box p={4} display="flex" flexDirection="column" height="100%" justifyContent="space-between">
                  <Box>
                    <Typography variant="caption" color="textSecondary" style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                      {category} TICKET
                    </Typography>
                    <Typography variant="h5" fontWeight={900} style={{ margin: '4px 0 16px 0', color: '#FFF' }}>
                      {showTitle}
                    </Typography>
                    
                    <Box display="flex" flexDirection="column" gap="12px">
                      <Box display="flex" alignItems="center" gap="10px">
                        <MapPin size={16} color="#EC4899" />
                        <Typography variant="body2" color="textSecondary">
                          {locationName}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap="10px">
                        <Calendar size={16} color="#EC4899" />
                        <Typography variant="body2" color="textSecondary">
                          {dateStr}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap="10px">
                        <Clock size={16} color="#EC4899" />
                        <Typography variant="body2" color="textSecondary">
                          {timeStr}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap="10px">
                        <Armchair size={16} color="#EC4899" />
                        <Typography variant="body2" color="textSecondary">
                          Seats: <strong style={{ color: '#10B981' }}>{booking.seats_display}</strong>
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box mt={3} pt={2} style={{ borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
                    <Typography variant="caption" color="textSecondary" display="block">PASS ID</Typography>
                    <Typography variant="subtitle2" fontWeight={800} color="primary" style={{ fontFamily: 'monospace' }}>
                      {booking.booking_id}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {/* Simulated Ticket Cutouts */}
            <div className="ticket-cut-left" style={{ background: '#0F172A' }} />
            <div className="ticket-cut-right" style={{ background: '#0F172A' }} />

            {/* Separator Dashed Line */}
            <Box style={{ borderTop: '2px dashed rgba(255,255,255,0.1)', margin: '0 24px' }} />

            {/* QR Code Entry Section */}
            <Box p={4} display="flex" flexDirection="column" alignItems="center" textAlign="center" gap="16px">
              <Typography variant="subtitle2" fontWeight={800} color="textSecondary" display="flex" alignItems="center" gap="6px">
                <QrCode size={16} color="#10B981" /> SCAN FOR GATE ENTRY
              </Typography>
              
              {booking.qr_code_url ? (
                <Box p={2.5} style={{ background: '#FFF', borderRadius: '16px', display: 'inline-block', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                  <img 
                    src={booking.qr_code_url} 
                    alt="Entry QR Code" 
                    style={{ display: 'block', width: '160px', height: '160px' }} 
                  />
                </Box>
              ) : (
                <Box p={4}>
                  <CircularProgress size={30} style={{ color: '#EC4899' }} />
                </Box>
              )}

              <Typography variant="caption" color="textSecondary" style={{ maxWidth: '280px', lineHeight: '1.4' }}>
                Present this QR code to the usher at the cinema entry gate. A copy has been dispatched to <strong style={{ color: '#FFF' }}>{user?.email}</strong>.
              </Typography>
            </Box>
          </Paper>
        </motion.div>

        {/* Alerts / Action Buttons */}
        <Box width="100%" maxWidth="600px">
          {emailSent && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <Alert severity="success" style={{ marginBottom: '16px', background: 'rgba(16, 185, 129, 0.1)', color: '#A7F3D0', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                Confirmation email sent successfully!
              </Alert>
            </motion.div>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Button 
                variant="outlined" 
                fullWidth 
                startIcon={<Mail size={16} />}
                onClick={resendEmail}
                style={{ 
                  borderColor: 'rgba(255,255,255,0.1)', 
                  color: '#FFF', 
                  textTransform: 'none', 
                  fontWeight: 700,
                  padding: '10px',
                  borderRadius: '10px'
                }}
              >
                Resend Mail
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button 
                variant="contained" 
                fullWidth
                onClick={() => navigate('/')}
                className="bg-gradient-primary glow-pink"
                style={{ 
                  color: '#0B0F19',
                  textTransform: 'none', 
                  fontWeight: 800,
                  padding: '10px',
                  borderRadius: '10px'
                }}
              >
                Book More
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button 
                variant="contained" 
                fullWidth
                onClick={() => navigate('/profile')}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  color: '#FFF', 
                  textTransform: 'none', 
                  fontWeight: 700,
                  padding: '10px',
                  borderRadius: '10px'
                }}
              >
                Go to Profile
              </Button>
            </Grid>
          </Grid>
        </Box>

      </Box>
    </Container>
  );
};

export default PaymentSuccess;
