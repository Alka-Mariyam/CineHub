import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { Ticket, Calendar, Clock, MapPin, Armchair, CheckCircle2, AlertCircle, Sparkles, CreditCard, ChevronLeft, ArrowRight, Mail } from 'lucide-react';
import { Container, Grid, Box, Typography, Button, Paper, Divider, CircularProgress, Alert } from '@mui/material';
import { API, fetchUserProfile } from '../store';

const CheckoutPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  // Promo Code State
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoError, setPromoError] = useState('');

  // Gift Card State
  const [giftCard, setGiftCard] = useState('');
  const [giftCardApplied, setGiftCardApplied] = useState(null);
  const [giftCardError, setGiftCardError] = useState('');

  // CinePoints State
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [pointsAppliedDiscount, setPointsAppliedDiscount] = useState(0);

  const fetchBookingDetails = () => {
    API.get(`/bookings/${bookingId}/`)
      .then((res) => {
        setBooking(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Failed to load ticket details.');
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const queryParams = new URLSearchParams(location.search);
    const sessionId = queryParams.get('session_id');

    if (sessionId) {
      setPaying(true);
      setError('');
      API.post('/stripe-confirm/', {
        booking_id: bookingId,
        session_id: sessionId
      })
        .then(() => {
          dispatch(fetchUserProfile());
          navigate(`/payment-success/${bookingId}`, { replace: true });
        })
        .catch((err) => {
          console.error("Stripe confirmation error:", err);
          setError(err.response?.data?.error || err.response?.data?.detail || err.message || 'Stripe payment confirmation failed.');
          setPaying(false);
          fetchBookingDetails();
        });
    } else {
      fetchBookingDetails();
    }
  }, [bookingId, isAuthenticated, location.search]);

  const handleApplyPromo = () => {
    setPromoError('');
    API.post('/validate-promo/', {
      booking_id: bookingId,
      promo_code: promoCode
    })
      .then((res) => {
        setPromoApplied({
          code: res.data.promo_code,
          discount: res.data.discount
        });
      })
      .catch((err) => {
        setPromoError(err.response?.data?.error || 'Invalid promo code.');
      });
  };

  const handleRemovePromo = () => {
    setPromoApplied(null);
    setPromoCode('');
    setPromoError('');
  };

  const handleApplyGiftCard = () => {
    setGiftCardError('');
    API.post('/validate-giftcard/', {
      code: giftCard
    })
      .then((res) => {
        setGiftCardApplied({
          code: res.data.code,
          value: res.data.value
        });
      })
      .catch((err) => {
        setGiftCardError(err.response?.data?.error || 'Invalid gift card.');
      });
  };

  const handleRemoveGiftCard = () => {
    setGiftCardApplied(null);
    setGiftCard('');
    setGiftCardError('');
  };

  const handlePointsChange = (points) => {
    setPointsToRedeem(points);
    if (points === 100) {
      setPointsAppliedDiscount(10);
    } else if (points === 250) {
      setPointsAppliedDiscount(30);
    } else if (points === 500) {
      setPointsAppliedDiscount(75);
    } else {
      setPointsAppliedDiscount(0);
    }
  };



  const handleFinalizePayment = () => {
    setPaying(true);
    setError('');
    API.post('/stripe-checkout/', {
      booking_id: bookingId,
      promo_code: promoApplied?.code || null,
      gift_card_code: giftCardApplied?.code || null,
      redeem_points: pointsToRedeem || null,
    })
      .then((res) => {
        if (res.data.session_url) {
          window.location.href = res.data.session_url;
        } else if (res.data.success) {
          dispatch(fetchUserProfile());
          navigate(`/payment-success/${bookingId}`);
        }
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Failed to process payment.');
        setPaying(false);
      });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="500px" flexDirection="column" gap="16px">
        <CircularProgress style={{ color: '#EC4899' }} />
        <Typography variant="h6" color="textSecondary">Fetching ticket details...</Typography>
      </Box>
    );
  }

  if (error && !booking) {
    return (
      <Container maxWidth="sm" style={{ marginTop: '80px' }}>
        <Paper className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <AlertCircle size={48} color="#EF4444" style={{ marginBottom: '16px' }} />
          <Typography variant="h5" fontWeight={800} gutterBottom>Failed to Load Booking</Typography>
          <Typography variant="body2" color="textSecondary" mb={4}>{error}</Typography>
          <Button variant="contained" className="bg-gradient-primary" onClick={() => navigate('/')} style={{ color: '#0B0F19', fontWeight: 800 }}>
            Go Back Home
          </Button>
        </Paper>
      </Container>
    );
  }

  const basePrice = parseFloat(booking.total_price);
  const convenienceCharge = 25.00;
  const gst = 4.50;
  const subTotal = basePrice + convenienceCharge + gst;

  const promoDiscountVal = promoApplied ? parseFloat(promoApplied.discount) : 0;
  const giftCardDiscountVal = giftCardApplied ? parseFloat(giftCardApplied.value) : 0;
  const pointsDiscountVal = parseFloat(pointsAppliedDiscount);

  const totalDiscounts = promoDiscountVal + giftCardDiscountVal + pointsDiscountVal;
  const finalPayable = Math.max(subTotal - totalDiscounts, 0.0).toFixed(2);

  const show = booking.show_detail;
  const itemTitle = show?.movie_detail?.title || show?.event_title || show?.sports_title;
  const poster = show?.movie_detail?.poster || show?.event_banner || show?.sports_banner;
  const language = show?.movie_detail?.language;
  const category = show?.movie_detail ? 'Movie' : (show?.event_title ? 'Event' : 'Sport');
  const dateStr = show?.start_time ? new Date(show.start_time).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const timeStr = show?.start_time ? new Date(show.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
  const locationName = show?.theatre_detail?.name || show?.venue_detail?.name;

  return (
    <Container maxWidth="lg" style={{ marginTop: '50px', marginBottom: '80px' }}>
      
      {/* Back button */}
      <Button 
        startIcon={<ChevronLeft size={16} />} 
        onClick={() => navigate(-1)} 
        style={{ color: '#94A3B8', marginBottom: '24px', fontWeight: 700 }}
      >
        Back to Seating Layout
      </Button>

      {error && <Alert severity="error" style={{ marginBottom: '24px', background: 'rgba(239, 68, 68, 0.1)', color: '#FCA5A5', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</Alert>}

      <Grid container spacing={4}>
        {/* LEFT COLUMN: The Ticket Visual */}
        <Grid item xs={12} md={7}>
          <Typography variant="h5" fontWeight={900} mb={3} display="flex" alignItems="center" gap="10px">
            <Ticket size={24} color="#EC4899" />
            {booking.status === 'Confirmed' ? 'Your Confirmed Ticket' : 'Review Ticket Reservation'}
          </Typography>

          {/* Ticket Body */}
          <Paper 
            className="glass-panel" 
            style={{ 
              position: 'relative',
              borderRadius: '24px', 
              overflow: 'hidden',
              border: booking.status === 'Confirmed' ? '2px solid #10B981' : '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: booking.status === 'Confirmed' ? '0 0 30px rgba(16, 185, 129, 0.15)' : 'none'
            }}
          >
            {/* Ticket Header status strip */}
            <Box 
              p={1.5} 
              textAlign="center" 
              style={{ 
                background: booking.status === 'Confirmed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.15)',
                color: booking.status === 'Confirmed' ? '#10B981' : '#FACC15',
                borderBottom: booking.status === 'Confirmed' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(234, 179, 8, 0.3)'
              }}
            >
              <Typography variant="subtitle2" fontWeight={900} style={{ letterSpacing: '2px', fontSize: '12px' }}>
                STATUS: {booking.status.toUpperCase()}
              </Typography>
            </Box>

            <Grid container>
              {/* Poster Part */}
              <Grid item xs={12} sm={4}>
                <Box style={{ height: '100%', minHeight: '220px', position: 'relative' }}>
                  <img 
                    src={poster} 
                    alt={itemTitle} 
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

              {/* Info Part */}
              <Grid item xs={12} sm={8}>
                <Box p={4} display="flex" flexDirection="column" height="100%" justifyContent="space-between">
                  <Box>
                    <Typography variant="caption" color="textSecondary" style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {category} Booking
                    </Typography>
                    <Typography variant="h5" fontWeight={900} style={{ margin: '4px 0 16px 0' }}>
                      {itemTitle}
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
                          Seats: <strong style={{ color: '#FFF' }}>{booking.seats_display}</strong> ({booking.seats_display.split(',').length} Tickets)
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box mt={3} pt={2} style={{ borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
                    <Typography variant="caption" color="textSecondary" display="block">TICKET ID</Typography>
                    <Typography variant="subtitle2" fontWeight={800} color="primary">{booking.booking_id}</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {/* Simulated ticket cuts */}
            <div className="ticket-cut-left" />
            <div className="ticket-cut-right" />
          </Paper>

          {booking.status === 'Confirmed' && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Box mt={3} p={3} className="glass-panel" display="flex" alignItems="flex-start" gap="14px" style={{ border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <CheckCircle2 size={24} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                <Box>
                  <Typography variant="h6" fontWeight={800} style={{ color: '#10B981' }}>Successful Payment & Booking Confirmed! 🎉</Typography>
                  <Typography variant="body2" color="textSecondary" mt={0.5}>
                    Successful Payment & Booking Confirmed! A confirmation email with your QR ticket has been sent to your registered email address.
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          )}
        </Grid>

        <Grid item xs={12} md={5}>
          {booking.status === 'Pending' ? (
            <Box p={4} className="glass-panel" display="flex" flexDirection="column" gap="24px">
              <Typography variant="h6" fontWeight={800}>Billing Summary</Typography>
              
              <Box display="flex" flexDirection="column" gap="12px">
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="textSecondary">Base Price ({booking.seats_display.split(',').length} Seats)</Typography>
                  <Typography variant="body2" fontWeight={700}>₹{booking.total_price}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="textSecondary">Convenience Charge</Typography>
                  <Typography variant="body2" fontWeight={700}>₹25.00</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="textSecondary">GST (18%)</Typography>
                  <Typography variant="body2" fontWeight={700}>₹4.50</Typography>
                </Box>

                {/* Promo Code Discount if applied */}
                {promoApplied && (
                  <Box display="flex" justifyContent="space-between" style={{ color: '#10B981' }}>
                    <Typography variant="body2">Promo Discount ({promoApplied.code})</Typography>
                    <Typography variant="body2" fontWeight={700}>-₹{promoApplied.discount}</Typography>
                  </Box>
                )}

                {/* Gift Card Discount if applied */}
                {giftCardApplied && (
                  <Box display="flex" justifyContent="space-between" style={{ color: '#10B981' }}>
                    <Typography variant="body2">Gift Card Discount</Typography>
                    <Typography variant="body2" fontWeight={700}>-₹{giftCardApplied.value}</Typography>
                  </Box>
                )}

                {/* CinePoints Discount if applied */}
                {pointsAppliedDiscount > 0 && (
                  <Box display="flex" justifyContent="space-between" style={{ color: '#10B981' }}>
                    <Typography variant="body2">CinePoints Discount</Typography>
                    <Typography variant="body2" fontWeight={700}>-₹{pointsAppliedDiscount}</Typography>
                  </Box>
                )}

                <Divider style={{ background: 'rgba(255,255,255,0.08)' }} />
                <Box display="flex" justifyContent="space-between" mt={1}>
                  <Typography variant="subtitle1" fontWeight={900}>Total Amount</Typography>
                  <Typography variant="subtitle1" fontWeight={900} color="primary">₹{finalPayable}</Typography>
                </Box>
              </Box>

              {/* Offers & Loyalty Section */}
              <Box display="flex" flexDirection="column" gap="16px" p={2} style={{ background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <Typography variant="subtitle2" fontWeight={800} color="primary" display="flex" alignItems="center" gap="6px">
                  <Sparkles size={16} /> Offers & Rewards
                </Typography>

                {/* Promo Code Input */}
                <Box>
                  <Typography variant="caption" color="textSecondary" display="block" mb={0.5}>Apply Promo Code</Typography>
                  <Box display="flex" gap="8px">
                    <input 
                      type="text" 
                      placeholder="e.g. CINE50, BOGOPASS" 
                      value={promoCode} 
                      onChange={(e) => setPromoCode(e.target.value)}
                      disabled={promoApplied !== null}
                      style={{ 
                        flexGrow: 1, 
                        background: 'rgba(11, 15, 25, 0.6)', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        borderRadius: '8px', 
                        padding: '8px 12px', 
                        color: '#FFF', 
                        fontFamily: 'inherit',
                        fontSize: '14px',
                        outline: 'none'
                      }} 
                    />
                    {promoApplied ? (
                      <Button 
                        variant="outlined" 
                        color="error" 
                        size="small"
                        onClick={handleRemovePromo}
                        style={{ textTransform: 'none', fontWeight: 700 }}
                      >
                        Remove
                      </Button>
                    ) : (
                      <Button 
                        variant="contained" 
                        className="bg-gradient-primary" 
                        size="small"
                        onClick={handleApplyPromo}
                        disabled={!promoCode.trim()}
                        style={{ color: '#0B0F19', fontWeight: 800, textTransform: 'none' }}
                      >
                        Apply
                      </Button>
                    )}
                  </Box>
                  {promoError && <Typography variant="caption" color="error" mt={0.5} display="block">{promoError}</Typography>}
                  {promoApplied && <Typography variant="caption" style={{ color: '#10B981' }} mt={0.5} display="block">Promo code applied successfully!</Typography>}
                </Box>

                {/* Gift Card Input */}
                <Box>
                  <Typography variant="caption" color="textSecondary" display="block" mb={0.5}>Redeem Gift Card</Typography>
                  <Box display="flex" gap="8px">
                    <input 
                      type="text" 
                      placeholder="Gift Card Code" 
                      value={giftCard} 
                      onChange={(e) => setGiftCard(e.target.value)}
                      disabled={giftCardApplied !== null}
                      style={{ 
                        flexGrow: 1, 
                        background: 'rgba(11, 15, 25, 0.6)', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        borderRadius: '8px', 
                        padding: '8px 12px', 
                        color: '#FFF', 
                        fontFamily: 'inherit',
                        fontSize: '14px',
                        outline: 'none'
                      }} 
                    />
                    {giftCardApplied ? (
                      <Button 
                        variant="outlined" 
                        color="error" 
                        size="small"
                        onClick={handleRemoveGiftCard}
                        style={{ textTransform: 'none', fontWeight: 700 }}
                      >
                        Remove
                      </Button>
                    ) : (
                      <Button 
                        variant="contained" 
                        className="bg-gradient-primary" 
                        size="small"
                        onClick={handleApplyGiftCard}
                        disabled={!giftCard.trim()}
                        style={{ color: '#0B0F19', fontWeight: 800, textTransform: 'none' }}
                      >
                        Redeem
                      </Button>
                    )}
                  </Box>
                  {giftCardError && <Typography variant="caption" color="error" mt={0.5} display="block">{giftCardError}</Typography>}
                  {giftCardApplied && <Typography variant="caption" style={{ color: '#10B981' }} mt={0.5} display="block">Gift card balance applied!</Typography>}
                </Box>

                {/* CinePoints Redemption Selector */}
                <Box>
                  <Typography variant="caption" color="textSecondary" display="block" mb={0.5}>
                    Redeem CinePoints (Available: {user?.total_reward_points || 0} pts)
                  </Typography>
                  <select
                    value={pointsToRedeem}
                    onChange={(e) => handlePointsChange(parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      background: 'rgba(11, 15, 25, 0.6)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#FFF',
                      fontFamily: 'inherit',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  >
                    <option value={0} style={{ background: '#161F30' }}>Do not redeem points</option>
                    <option value={100} disabled={!user || user.total_reward_points < 100} style={{ background: '#161F30' }}>
                      Redeem 100 Points (₹10 Discount)
                    </option>
                    <option value={250} disabled={!user || user.total_reward_points < 250} style={{ background: '#161F30' }}>
                      Redeem 250 Points (₹30 Discount)
                    </option>
                    <option value={500} disabled={!user || user.total_reward_points < 500} style={{ background: '#161F30' }}>
                      Redeem 500 Points (₹75 Discount)
                    </option>
                  </select>
                </Box>
              </Box>



              <Box display="flex" flexDirection="column" gap="12px">
            <Button
              variant="contained"
              onClick={handleFinalizePayment}
              disabled={paying}
              className="bg-gradient-primary glow-pink"
              style={{ color: '#0B0F19', fontWeight: 800, padding: '12px', borderRadius: '8px' }}
              startIcon={paying ? <CircularProgress size={20} style={{ color: '#0B0F19' }} /> : <CreditCard size={18} />}
            >
              Pay Now
            </Button>
              </Box>
            </Box>
          ) : (
            /* Ticket Confirmed: Display Ticket QR code */
            <Box p={4} className="glass-panel" display="flex" flexDirection="column" alignItems="center" gap="24px" textAlign="center">
              <Typography variant="h6" fontWeight={800}>Digital Ticket QR Code</Typography>
              
              {booking.qr_code_url ? (
                <Box p={2} style={{ background: '#FFF', borderRadius: '16px' }}>
                  <img 
                    src={booking.qr_code_url} 
                    alt="Ticket QR Code" 
                    style={{ display: 'block', width: '180px', height: '180px' }} 
                  />
                </Box>
              ) : (
                <Box p={5}>
                  <CircularProgress size={40} style={{ color: '#EC4899' }} />
                </Box>
              )}

              <Typography variant="body2" color="textSecondary" style={{ maxWidth: '280px' }}>
                Scan this QR code at the cinema entry gate to authorize your seat entry.
              </Typography>

              <Divider style={{ background: 'rgba(255,255,255,0.08)', width: '100%' }} />

              <Box display="flex" gap="10px" width="100%">
                <Button 
                  variant="outlined" 
                  fullWidth 
                  startIcon={<Mail size={16} />}
                  onClick={() => alert(`Ticket copy sent successfully to ${user?.email}!`)}
                  style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#FFF', textTransform: 'none', fontWeight: 700 }}
                >
                  Resend Mail
                </Button>
                <Button 
                  variant="contained" 
                  fullWidth
                  onClick={() => navigate('/')}
                  style={{ background: 'rgba(124, 58, 237, 0.2)', border: '1px solid #7C3AED', color: '#FFF', textTransform: 'none', fontWeight: 800 }}
                >
                  Book More
                </Button>
              </Box>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Full-Screen Glassmorphic Payment Loading Shimmer */}
      {paying && (
        <PaymentProcessOverlay />
      )}
    </Container>
  );
};

const PaymentProcessOverlay = () => {
  const [step, setStep] = useState(0);
  const steps = [
    "Verifying transaction details...",
    "Validating promo codes and gift cards...",
    "Deducting CinePoints from wallet...",
    "Securing seat allocation...",
    "Generating digital ticket QR code...",
    "Dispatching confirmation email..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(11, 15, 25, 0.75)',
      backdropFilter: 'blur(20px)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#FFF'
    }}>
      <div style={{
        padding: '40px',
        borderRadius: '24px',
        background: 'rgba(22, 31, 48, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center',
        maxWidth: '450px',
        width: '90%',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Shimmer light effect moving across */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '50%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(236, 72, 153, 0.15), transparent)',
          animation: 'shimmer-move 2s infinite'
        }} />

        <CircularProgress size={60} style={{ color: '#EC4899', marginBottom: '24px' }} />
        
        <Typography variant="h6" fontWeight={800} mb={1} className="text-gradient">
          Processing Payment
        </Typography>
        
        <Typography variant="body1" fontWeight={500} style={{ minHeight: '24px', color: '#E2E8F0' }}>
          {steps[step]}
        </Typography>

        <Box display="flex" justifyContent="center" gap="6px" mt={3}>
          {steps.map((_, index) => (
            <div 
              key={index}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: index <= step ? '#EC4899' : 'rgba(255,255,255,0.2)',
                transition: 'background 0.3s ease'
              }}
            />
          ))}
        </Box>
      </div>

      <style>{`
        @keyframes shimmer-move {
          0% { left: -100%; }
          100% { left: 200%; }
        }
      `}</style>
    </div>
  );
};

export default CheckoutPage;
