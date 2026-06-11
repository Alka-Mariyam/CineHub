import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Armchair, ChevronRight, Share2, Award, Gift, Ticket, CreditCard, AlertTriangle } from 'lucide-react';
import { Container, Grid, Box, Typography, Button, Paper, Divider, TextField } from '@mui/material';
import { API } from '../store';

const BookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [show, setShow] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  const isReserveOnly = new URLSearchParams(location.search).get('reserve') === 'true';

  useEffect(() => {
    // Fetch show details
    API.get(`/shows/${id}/`)
      .then((res) => {
        setShow(res.data);
      })
      .catch(() => {});

    // Fetch seat layout
    API.get(`/seats/?show=${id}`)
      .then((res) => {
        setSeats(res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [id]);

  const handleSeatClick = (seat) => {
    if (seat.status !== 'Available') return;

    const code = `${seat.row_label}${seat.column_number}`;
    if (selectedSeats.includes(code)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== code));
    } else {
      setSelectedSeats([...selectedSeats, code]);
    }
  };

  const handleBookNow = () => {
    if (!isAuthenticated) {
      alert("Please login first to book tickets.");
      navigate('/login');
      return;
    }

    if (selectedSeats.length === 0) {
      alert("Please select at least one seat.");
      return;
    }

    setBookingInProgress(true);
    // Reserve the seats and then redirect to the ticket details & payment checkout page
    API.post('/reserve/', { show: id, seats: selectedSeats })
      .then((res) => {
        const bookingId = res.data.booking.booking_id;
        navigate(`/checkout/${bookingId}`);
      })
      .catch((err) => {
        alert(err.response?.data?.error || 'Failed to reserve seats.');
        setBookingInProgress(false);
      });
  };

  const handleBookLater = () => {
    if (!isAuthenticated) {
      alert("Please login first to reserve seats.");
      navigate('/login');
      return;
    }

    if (selectedSeats.length === 0) {
      alert("Please select at least one seat.");
      return;
    }

    setBookingInProgress(true);
    API.post('/reserve/', { show: id, seats: selectedSeats })
      .then((res) => {
        alert("Seats Reserved successfully! Please complete payment at least 1 day before the show from your Profile.");
        navigate('/profile?tab=orders');
      })
      .catch((err) => {
        alert(err.response?.data?.error || 'Reservation failed.');
        setBookingInProgress(false);
      });
  };

  const handleCreateGroupBooking = () => {
    if (!isAuthenticated) {
      alert("Please login first to create a group booking.");
      navigate('/login');
      return;
    }

    if (selectedSeats.length === 0) {
      alert("Please select your starting seats for the group plan.");
      return;
    }

    API.post('/group/create/', { show: id, seats: selectedSeats })
      .then((res) => {
        const inviteCode = res.data.invite_code;
        navigate(`/group-booking/${inviteCode}`);
      })
      .catch((err) => {
        alert(err.response?.data?.error || 'Failed to create group booking planner.');
      });
  };

  if (loading || !show) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px" flexDirection="column" gap="16px">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Armchair size={40} color="#EC4899" />
        </motion.div>
        <Typography variant="h6" color="textSecondary">Loading seat layout...</Typography>
      </Box>
    );
  }

  const showTitle = show.movie_detail?.title || (show.event_title || show.sports_title || "Show");
  const showPlace = show.theatre_detail ? show.theatre_detail.name : (show.venue_name || "Cinema Hall");
  const dateObj = new Date(show.start_time);
  const formattedDate = dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Rows and Columns structure
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const columns = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const totalPrice = (selectedSeats.length * show.price).toFixed(2);

  return (
    <Box pb={8}>
      {/* Top Info Bar */}
      <Box py={2} style={{ background: 'rgba(22, 31, 48, 0.8)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Container maxWidth="lg">
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="12px">
            <Box>
              <Typography variant="h6" fontWeight={800} className="text-gradient">{showTitle}</Typography>
              <Box display="flex" gap="16px" alignItems="center" mt={0.5}>
                <Box display="flex" alignItems="center" gap="4px">
                  <MapPin size={14} color="#EC4899" />
                  <Typography variant="caption" color="textSecondary">{showPlace}</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap="4px">
                  <Calendar size={14} color="#FACC15" />
                  <Typography variant="caption" color="textSecondary">{formattedDate}</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap="4px">
                  <Clock size={14} color="#7C3AED" />
                  <Typography variant="caption" color="textSecondary">{formattedTime}</Typography>
                </Box>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap="8px">
              <Ticket size={18} color="#FACC15" />
              <Typography variant="body2" fontWeight={700}>₹{show.price} / seat</Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" style={{ marginTop: '32px' }}>
        <Grid container spacing={4}>
          
          {/* Seats Hall Column */}
          <Grid item xs={12} md={8}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Box p={4} className="glass-panel" display="flex" flexDirection="column" alignItems="center">
                
                {/* Screen layout */}
                <Box width="100%" textAlign="center" mb={6}>
                  <Typography variant="caption" color="textSecondary" style={{ letterSpacing: '6px', fontSize: '11px' }}>
                    SCREEN
                  </Typography>
                  <div style={{
                    height: '4px', width: '70%',
                    background: 'linear-gradient(to right, rgba(124, 58, 237, 0) 0%, #7C3AED 30%, #EC4899 70%, rgba(236, 72, 153, 0) 100%)',
                    margin: '10px auto 0 auto', borderRadius: '2px',
                    boxShadow: '0 4px 20px rgba(124, 58, 237, 0.4), 0 0 40px rgba(236, 72, 153, 0.2)'
                  }} />
                </Box>

                {/* Seat Grid */}
                <Box display="flex" flexDirection="column" gap="12px" width="100%" maxWidth="520px">
                  {rows.map((row, rowIdx) => (
                    <motion.div key={row} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * rowIdx }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                        {/* Row Label Left */}
                        <Typography variant="body2" style={{ width: '24px', fontWeight: 'bold', color: '#64748B', fontSize: '13px' }}>
                          {row}
                        </Typography>

                        {/* Seats */}
                        <Box display="flex" gap="8px">
                          {columns.map((col) => {
                            const seatObj = seats.find((s) => s.row_label === row && s.column_number === col) || { status: 'Available', row_label: row, column_number: col };
                            const code = `${row}${col}`;
                            const isSelected = selectedSeats.includes(code);

                            let bgColor = '#059669';
                            let cursor = 'pointer';
                            let shadow = 'none';
                            let scale = 1;
                            let borderColor = 'transparent';

                            if (seatObj.status === 'Reserved') {
                              bgColor = '#D97706';
                              cursor = 'not-allowed';
                            }
                            if (seatObj.status === 'Booked') {
                              bgColor = '#DC2626';
                              cursor = 'not-allowed';
                            }
                            if (isSelected) {
                              bgColor = '#EC4899';
                              shadow = '0 0 12px rgba(236,72,153,0.6)';
                              scale = 1.1;
                              borderColor = '#F472B6';
                            }

                            // Gap in the middle (aisle)
                            const hasAisle = col === 5;

                            return (
                              <React.Fragment key={col}>
                                <motion.div
                                  whileHover={seatObj.status === 'Available' && !isSelected ? { scale: 1.15, y: -2 } : {}}
                                  whileTap={seatObj.status === 'Available' ? { scale: 0.9 } : {}}
                                  onClick={() => handleSeatClick(seatObj)}
                                  style={{
                                    width: '32px', height: '32px', borderRadius: '8px 8px 4px 4px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '10px', fontWeight: 'bold', userSelect: 'none',
                                    background: bgColor, cursor, boxShadow: shadow,
                                    transform: `scale(${scale})`, border: `1px solid ${borderColor}`,
                                    transition: 'all 0.2s ease', color: '#FFF'
                                  }}
                                >
                                  {col}
                                </motion.div>
                                {hasAisle && <Box width="16px" />}
                              </React.Fragment>
                            );
                          })}
                        </Box>

                        {/* Row Label Right */}
                        <Typography variant="body2" style={{ width: '24px', fontWeight: 'bold', textAlign: 'right', color: '#64748B', fontSize: '13px' }}>
                          {row}
                        </Typography>
                      </Box>
                    </motion.div>
                  ))}
                </Box>

                {/* Legend */}
                <Box display="flex" gap="24px" mt={6} flexWrap="wrap" justifyContent="center">
                  {[
                    { color: '#059669', label: 'Available', icon: '🟢' },
                    { color: '#D97706', label: 'Reserved', icon: '🟡' },
                    { color: '#DC2626', label: 'Booked', icon: '🔴' },
                    { color: '#EC4899', label: 'Selected', icon: '🩷', shadow: true },
                  ].map((item) => (
                    <Box key={item.label} display="flex" alignItems="center" gap="8px">
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '6px 6px 3px 3px',
                        background: item.color,
                        boxShadow: item.shadow ? '0 0 8px rgba(236,72,153,0.5)' : 'none'
                      }} />
                      <Typography variant="caption" color="textSecondary" fontWeight={600}>{item.label}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </motion.div>
          </Grid>

          {/* Booking Summary Panel Column */}
          <Grid item xs={12} md={4}>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <Box p={3} className="glass-panel" style={{ position: 'sticky', top: '100px' }}>
                <Typography variant="h6" fontWeight={700} gutterBottom display="flex" alignItems="center" gap="8px">
                  <Ticket size={20} color="#EC4899" />
                  Booking Summary
                </Typography>
                <Divider style={{ background: 'rgba(255,255,255,0.08)', margin: '14px 0' }} />

                <Box display="flex" flexDirection="column" gap="12px" mb={3}>
                  <Typography variant="h5" fontWeight={800} className="text-gradient">{showTitle}</Typography>
                  <Box display="flex" alignItems="center" gap="8px" color="textSecondary">
                    <MapPin size={16} color="#EC4899" />
                    <Typography variant="body2">{showPlace}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap="8px" color="textSecondary">
                    <Calendar size={16} color="#FACC15" />
                    <Typography variant="body2">{formattedDate}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap="8px" color="textSecondary">
                    <Clock size={16} color="#7C3AED" />
                    <Typography variant="body2">{formattedTime}</Typography>
                  </Box>
                </Box>

                <Divider style={{ background: 'rgba(255,255,255,0.08)', margin: '14px 0' }} />

                {/* Selected seats */}
                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary" mb={1}>Seats Selected:</Typography>
                  {selectedSeats.length > 0 ? (
                    <Box display="flex" flexWrap="wrap" gap="6px">
                      {selectedSeats.map((seat) => (
                        <Box key={seat} px={1.5} py={0.5} borderRadius="6px"
                          style={{ background: 'rgba(236,72,153,0.2)', border: '1px solid rgba(236,72,153,0.3)' }}>
                          <Typography variant="caption" fontWeight={700} color="primary">{seat}</Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="caption" color="textSecondary" fontStyle="italic">
                      Click seats above to select
                    </Typography>
                  )}
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" color="textSecondary">Tickets:</Typography>
                  <Typography variant="body2" fontWeight={700}>{selectedSeats.length}</Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" color="textSecondary">Price per ticket:</Typography>
                  <Typography variant="body2" fontWeight={700}>₹{show.price}</Typography>
                </Box>

                <Divider style={{ background: 'rgba(255,255,255,0.08)', margin: '14px 0' }} />

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                  <Typography variant="body1" fontWeight={700}>Total Amount:</Typography>
                  <Typography variant="h5" fontWeight={900} style={{ color: '#FACC15' }}>
                    ₹{totalPrice}
                  </Typography>
                </Box>

                {/* Action Buttons */}
                <Box display="flex" flexDirection="column" gap="12px">
                  {!isReserveOnly && (
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button variant="contained" className="bg-gradient-primary glow-pink" fullWidth
                        onClick={handleBookNow} disabled={bookingInProgress || selectedSeats.length === 0}
                        startIcon={<CreditCard size={18} />}
                        style={{ padding: '14px', borderRadius: '12px', fontWeight: 800, color: '#0B0F19', fontSize: '15px' }}>
                        {bookingInProgress ? 'Processing...' : 'Pay Now & Book'}
                      </Button>
                    </motion.div>
                  )}

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="outlined" color="warning" fullWidth
                      onClick={handleBookLater} disabled={bookingInProgress || selectedSeats.length === 0}
                      startIcon={<Clock size={18} />}
                      style={{ padding: '12px', borderRadius: '12px', fontWeight: 700 }}>
                      Book Later (Reserve Seats)
                    </Button>
                  </motion.div>

                  {!isReserveOnly && (
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button variant="outlined" color="secondary" fullWidth
                        onClick={handleCreateGroupBooking} disabled={selectedSeats.length === 0}
                        startIcon={<Share2 size={16} />}
                        style={{ padding: '12px', borderRadius: '12px', fontWeight: 700 }}>
                        Start Group Booking
                      </Button>
                    </motion.div>
                  )}

                  {/* Reservation info */}
                  <Box mt={1} display="flex" alignItems="start" gap="8px" p={2} borderRadius="10px"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
                    <AlertTriangle size={16} color="#F59E0B" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <Typography variant="caption" color="#F59E0B" style={{ lineHeight: '1.5' }}>
                      <strong>Book Later:</strong> Reserves seats until 1 day before the show. Expired reservations are auto-released via Celery tasks.
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default BookingPage;
