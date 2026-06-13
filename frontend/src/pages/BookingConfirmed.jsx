import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Grid, Box, Typography, Button, Paper, CircularProgress, Alert } from '@mui/material';
import { Mail, CheckCircle2, QrCode, MapPin, Calendar, Clock, Armchair } from 'lucide-react';
import { motion } from 'framer-motion';
import { API, fetchUserProfile } from '../store';
import GlassmorphicCard from '../components/GlassmorphicCard';

const BookingConfirmed = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [recommendedMovies, setRecommendedMovies] = useState([]);

  const fetchBooking = async () => {
    try {
      const res = await API.get(`/bookings/${bookingId}/`);
      setBooking(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
    dispatch(fetchUserProfile());
  }, [bookingId]);

  useEffect(() => {
    const loadRecommendations = async () => {
      if (!booking) return;
      try {
        const city = booking.show_detail?.theatre_detail?.city || 'Mumbai';
        const res = await API.get(`/movies/?city=${city}&is_recommended=True&max_price=300`);
        setRecommendedMovies(res.data.results || res.data);
      } catch (_) {}
    };
    loadRecommendations();
  }, [booking]);

  const resendEmail = async () => {
    try {
      await API.post(`/resend-email/${bookingId}/`);
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 4000);
    } catch (_) {
      setError('Failed to resend email');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh" flexDirection="column" gap="16px">
        <CircularProgress style={{ color: '#EC4899' }} />
        <Typography variant="h6" color="textSecondary">Finalising your ticket…</Typography>
      </Box>
    );
  }

  if (error || !booking) {
    return (
      <Container maxWidth="sm" style={{ marginTop: '80px' }}>
        <Paper className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <Alert severity="error" style={{ background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.2)' }}>{error || 'Unable to load booking details.'}</Alert>
          <Button variant="contained" className="bg-gradient-primary" onClick={() => navigate('/')}
            style={{ marginTop: '24px', color: '#0B0F19', fontWeight: 800 }}>
            Go Home
          </Button>
        </Paper>
      </Container>
    );
  }

  const show = booking.show_detail;
  const title = show?.movie_detail?.title || show?.event_title || show?.sports_title || 'Your Ticket';
  const poster = show?.movie_detail?.poster || show?.event_banner || show?.sports_banner;
  const language = show?.movie_detail?.language;
  const category = show?.movie_detail ? 'Movie' : (show?.event_title ? 'Event' : 'Sport');
  const venue = show?.theatre_detail?.name || show?.venue_name || 'CineHub';
  const dateStr = show?.start_time ? new Date(show.start_time).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const timeStr = show?.start_time ? new Date(show.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <Container maxWidth="md" style={{ marginTop: '40px', marginBottom: '80px' }}>
      <Box display="flex" flexDirection="column" alignItems="center" gap="24px">
        {/* Celebration */}
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 10 }}>
          <Box display="flex" flexDirection="column" alignItems="center" gap="8px">
            <Box sx={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '2px solid #10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(16,185,129,0.3)' }}>
              <CheckCircle2 size={40} color="#10B981" />
            </Box>
            <Typography variant="h4" fontWeight={900} className="text-gradient">Booking Confirmed!</Typography>
            <Typography variant="body2" color="textSecondary">Your seat is reserved. Enjoy the show!</Typography>
          </Box>
        </motion.div>

        {/* Ticket Card */}
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} style={{ width: '100%', maxWidth: '600px' }}>
          <Paper className="glass-panel" sx={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', border: '2px solid rgba(16,185,129,0.4)', boxShadow: '0 10px 40px rgba(16,185,129,0.1)' }}>
            <Box p={1.5} textAlign="center" sx={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', borderBottom: '1px solid rgba(16,185,129,0.2)' }}>
              <Typography variant="subtitle2" fontWeight={900} sx={{ letterSpacing: '3px', fontSize: '11px' }}>DIGITAL ENTRY PASS</Typography>
            </Box>
            <Grid container>
              {poster && (
                <Grid item xs={12} sm={4}>
                  <Box sx={{ height: '100%', minHeight: '220px', position: 'relative' }}>
                    <img src={poster} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {language && (
                      <Box position="absolute" top="12px" left="12px" sx={{ background: '#EC4899', color: '#0B0F19', px: 1, py: 0.5, borderRadius: 1, fontSize: '10px', fontWeight: 900 }}>{language}</Box>
                    )}
                  </Box>
                </Grid>
              )}
              <Grid item xs={12} sm={poster ? 8 : 12}>
                <Box p={4} display="flex" flexDirection="column" height="100%" justifyContent="space-between">
                  <Box>
                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px' }}>{category} TICKET</Typography>
                    <Typography variant="h5" fontWeight={900} sx={{ my: 1, color: '#FFF' }}>{title}</Typography>
                    <Box display="flex" flexDirection="column" gap={1}>
                      <Box display="flex" alignItems="center" gap={1}><MapPin size={16} color="#EC4899" /><Typography variant="body2" color="textSecondary">{venue}</Typography></Box>
                      <Box display="flex" alignItems="center" gap={1}><Calendar size={16} color="#EC4899" /><Typography variant="body2" color="textSecondary">{dateStr}</Typography></Box>
                      <Box display="flex" alignItems="center" gap={1}><Clock size={16} color="#EC4899" /><Typography variant="body2" color="textSecondary">{timeStr}</Typography></Box>
                      <Box display="flex" alignItems="center" gap={1}><Armchair size={16} color="#EC4899" /><Typography variant="body2" color="textSecondary">Seats: <strong style={{ color: '#10B981' }}>{booking.seats_display}</strong></Typography></Box>
                    </Box>
                  </Box>
                  <Box mt={2} pt={1} sx={{ borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
                    <Typography variant="caption" color="textSecondary">PASS ID</Typography>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ fontFamily: 'monospace' }}>{booking.booking_id}</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
            <Box sx={{ borderTop: '2px dashed rgba(255,255,255,0.1)', mx: 3, my: 2 }} />
            <Box p={4} display="flex" flexDirection="column" alignItems="center" gap={2}>
              <Typography variant="subtitle2" fontWeight={800} color="textSecondary" display="flex" alignItems="center" gap={1}>
                <QrCode size={16} color="#10B981" /> SCAN FOR GATE ENTRY
              </Typography>
              {booking.qr_code_url ? (
                <Box p={2} sx={{ background: '#FFF', borderRadius: 2, boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                  <img src={booking.qr_code_url} alt="QR" style={{ width: 160, height: 160, display: 'block' }} />
                </Box>
              ) : (
                <CircularProgress size={30} sx={{ color: '#EC4899' }} />
              )}
            </Box>
          </Paper>
        </motion.div>

        {/* Action Buttons */}
        <Box width="100%" maxWidth="600px">
          {emailSent && (
            <Alert severity="success" sx={{ mb: 2, background: 'rgba(16,185,129,0.1)', color: '#A7F3D0', border: '1px solid rgba(16,185,129,0.2)' }}>Confirmation email sent!</Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Button variant="outlined" fullWidth startIcon={<Mail size={16} />} onClick={resendEmail}
                sx={{ borderColor: 'rgba(255,255,255,0.1)', color: '#FFF', textTransform: 'none', fontWeight: 700, py: 1, borderRadius: 2 }}>
                Resend Mail
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button variant="contained" fullWidth onClick={() => navigate('/')}
                className="bg-gradient-primary"
                sx={{ color: '#0B0F19', textTransform: 'none', fontWeight: 800, py: 1, borderRadius: 2 }}>
                Book More
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button variant="contained" fullWidth onClick={() => navigate('/profile')}
                sx={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', textTransform: 'none', fontWeight: 700, py: 1, borderRadius: 2 }}>
                Go to Profile
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Recommendations */}
        {recommendedMovies.length > 0 && (
          <Box width="100%" maxWidth="600px" mt={4}>
            <Typography variant="h6" fontWeight={800} mb={2} textAlign="center" className="text-gradient">Recommended Movies</Typography>
            <Grid container spacing={2}>
              {recommendedMovies.slice(0, 6).map((m) => (
                <Grid item xs={12} sm={6} key={m.id}>
                  <GlassmorphicCard onClick={() => navigate(`/movie/${m.id}`)}>
                    <Box sx={{ position: 'relative', pb: '140%', overflow: 'hidden' }}>
                      <img src={m.poster} alt={m.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Box>
                    <Box p={2}>
                      <Typography variant="subtitle1" fontWeight={800} noWrap>{m.title}</Typography>
                      <Typography variant="body2" color="textSecondary" noWrap>{m.genre}</Typography>
                      <Box display="flex" justifyContent="space-between" mt={1}>
                        <Typography variant="caption" color="primary">₹{m.price || '150'}</Typography>
                        <Button variant="contained" size="small" className="bg-gradient-primary" onClick={(e) => { e.stopPropagation(); navigate(`/movie/${m.id}`); }}>Book</Button>
                      </Box>
                    </Box>
                  </GlassmorphicCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default BookingConfirmed;
