import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Calendar, Clock, MapPin, Share2, Users, Check, AlertCircle, Copy } from 'lucide-react';
import { Container, Grid, Box, Typography, Button, Paper, Divider, TextField, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { API } from '../store';

const GroupBookingPage = () => {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [group, setGroup] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [friendName, setFriendName] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fetch group details
    API.get(`/group/detail/${inviteCode}/`)
      .then((res) => {
        setGroup(res.data);
        return API.get(`/seats/?show=${res.data.show}`);
      })
      .then((res) => {
        setSeats(res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [inviteCode]);

  const copyLink = () => {
    const link = `${window.location.origin}/group-booking/${inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSeatClick = (seat) => {
    if (seat.status !== 'Available') return;
    setSelectedSeat(`${seat.row_label}${seat.column_number}`);
  };

  const handleJoinGroup = (e) => {
    e.preventDefault();
    if (!friendName.trim()) {
      alert("Please enter your name.");
      return;
    }
    if (!selectedSeat) {
      alert("Please select a seat.");
      return;
    }

    API.post('/group/join/', {
      invite_code: inviteCode,
      name: friendName,
      seats: [selectedSeat]
    })
      .then((res) => {
        setGroup(res.data);
        setSelectedSeat(null);
        setFriendName('');
        // Reload seat layout
        return API.get(`/seats/?show=${res.data.show}`);
      })
      .then((res) => setSeats(res.data))
      .catch((err) => {
        alert(err.response?.data?.error || 'Failed to join group booking.');
      });
  };

  const handleOrganizerPay = () => {
    // Redirect to checkout for the group booking
    navigate(`/profile?checkoutGroup=${inviteCode}`);
  };

  if (loading || !group) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <Typography variant="h6">Loading Group Booking Planner...</Typography>
      </Box>
    );
  }

  const isOrganizer = user && group.organizer_detail && user.email === group.organizer_detail.email;
  const show = group.show_detail || {};
  const showTitle = show.movie_detail?.title || (show.event_title || show.sports_title);
  const showPlace = show.theatre_detail ? show.theatre_detail.name : (show.venue_name || "Cinema Hall");
  const dateObj = new Date(show.start_time);
  const formattedDate = dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Rows and Columns structure
  const rows = ['A', 'B', 'C', 'D', 'E'];
  const columns = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <Container maxWidth="lg" style={{ marginTop: '40px' }}>
      <Grid container spacing={4}>
        
        {/* Left Column: Group Info & Invite Link */}
        <Grid item xs={12} md={5}>
          <Box p={3} className="glass-panel" mb={4}>
            <Typography variant="h5" fontWeight={800} gutterBottom display="flex" alignItems="center" gap="10px">
              <Users size={24} color="#7C3AED" />
              Group Booking Planner
            </Typography>
            <Divider style={{ background: 'rgba(255,255,255,0.08)', margin: '14px 0' }} />

            <Box display="flex" flexDirection="column" gap="12px" mb={3}>
              <Typography variant="h5" fontWeight={800} color="primary">{showTitle}</Typography>
              <Box display="flex" alignItems="center" gap="8px" color="textSecondary">
                <MapPin size={16} />
                <Typography variant="body2">{showPlace}</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap="8px" color="textSecondary">
                <Calendar size={16} />
                <Typography variant="body2">{formattedDate} ({formattedTime})</Typography>
              </Box>
            </Box>

            <Divider style={{ background: 'rgba(255,255,255,0.08)', margin: '14px 0' }} />

            {/* Invite box */}
            <Box p={2.5} borderRadius="12px" background="rgba(124, 58, 237, 0.1)" border="1px solid rgba(124, 58, 237, 0.2)" mb={3}>
              <Typography variant="body2" fontWeight={700} gutterBottom display="flex" alignItems="center" gap="6px">
                <Share2 size={16} color="#A78BFA" />
                Invite Friends to Join:
              </Typography>
              <Box display="flex" mt={1.5} gap="10px">
                <TextField
                  size="small"
                  fullWidth
                  readOnly
                  value={`${window.location.origin}/group-booking/${inviteCode}`}
                  InputProps={{ style: { background: 'rgba(15,23,42,0.4)', color: '#FFFFFF', fontSize: '12px' } }}
                />
                <Button variant="contained" color="primary" onClick={copyLink} style={{ minWidth: 'auto' }}>
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </Button>
              </Box>
            </Box>

            {/* Members List */}
            <Typography variant="h6" fontWeight={700} mb={2}>Joined Friends</Typography>
            <List>
              {group.members.map((member) => (
                <ListItem key={member.id} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <ListItemIcon>
                    <Users size={16} color="#EC4899" />
                  </ListItemIcon>
                  <ListItemText
                    primary={member.name}
                    secondary={member.user ? "Registered Account" : "Guest User"}
                    primaryTypographyProps={{ fontWeight: 'bold', fontSize: '14px' }}
                  />
                  <Box display="flex" alignItems="center" gap="10px">
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#A78BFA' }}>Seats: {member.seats_display}</span>
                    <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      {member.status}
                    </span>
                  </Box>
                </ListItem>
              ))}
            </List>

            {/* Organizer Payment button */}
            {isOrganizer && group.status === 'Active' && (
              <Button
                variant="contained"
                className="bg-gradient-primary glow-purple"
                fullWidth
                onClick={handleOrganizerPay}
                style={{ marginTop: '24px', padding: '12px', borderRadius: '10px', fontWeight: 800 }}
              >
                Checkout & Pay for Group (${(group.members.reduce((acc, m) => acc + (m.seats_display.split(',').length), 0) * show.price).toFixed(2)})
              </Button>
            )}

            {!isOrganizer && (
              <Box mt={3} display="flex" alignItems="start" gap="8px" p={1.5} borderRadius="6px" background="rgba(255, 255, 255, 0.05)" border="1px solid rgba(255,255,255,0.08)">
                <AlertCircle size={16} color="#EC4899" style={{ marginTop: '2px' }} />
                <Typography variant="caption" color="textSecondary" style={{ lineHeight: '1.4' }}>
                  Choose your seat on the right, type your name, and click "Join". The organizer will complete the checkout.
                </Typography>
              </Box>
            )}

          </Box>
        </Grid>

        {/* Right Column: Dynamic Join Hall grid */}
        <Grid item xs={12} md={7}>
          <Box p={3} className="glass-panel" display="flex" flexDirection="column" alignItems="center">
            
            {/* Form if guest / friend */}
            {group.status === 'Active' && !isOrganizer && (
              <Box component="form" onSubmit={handleJoinGroup} width="100%" maxWidth="400px" display="flex" flexDirection="column" gap="14px" mb={4}>
                <Typography variant="h6" fontWeight={700} textAlign="center">Select Your Seat</Typography>
                <TextField
                  fullWidth
                  size="small"
                  label="Your Name / Nickname"
                  placeholder="Enter your name"
                  value={friendName}
                  onChange={(e) => setFriendName(e.target.value)}
                  InputProps={{ style: { background: 'rgba(15,23,42,0.4)', color: '#FFFFFF', borderRadius: '8px' } }}
                  InputLabelProps={{ style: { color: '#94A3B8' } }}
                />
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="textSecondary">Selected Seat:</Typography>
                  <Typography variant="body1" fontWeight={800} color="primary">{selectedSeat || "None"}</Typography>
                </Box>
                <Button type="submit" variant="contained" className="bg-gradient-primary" fullWidth style={{ borderRadius: '8px', fontWeight: 700 }}>
                  Join Booking & Reserve Seat
                </Button>
              </Box>
            )}

            {/* Hall seats display */}
            <Box width="100%" textAlign="center" mb={4} borderBottom="1px solid rgba(255,255,255,0.05)" pb={2}>
              <Typography variant="caption" color="textSecondary">HALL LAYOUT</Typography>
            </Box>

            <Box display="flex" flexDirection="column" gap="14px" width="100%" maxWidth="440px">
              {rows.map((row) => (
                <Box key={row} display="flex" alignItems="center" justifyContent="space-between" width="100%">
                  <Typography variant="body2" color="textSecondary" style={{ width: '20px', fontWeight: 'bold' }}>{row}</Typography>
                  <Box display="flex" gap="8px">
                    {columns.map((col) => {
                      const seatObj = seats.find((s) => s.row_label === row && s.column_number === col) || { status: 'Available' };
                      const code = `${row}${col}`;
                      const isSelected = selectedSeat === code;

                      let seatClass = 'seat-available';
                      if (seatObj.status === 'Reserved') seatClass = 'seat-reserved';
                      if (seatObj.status === 'Booked') seatClass = 'seat-booked';
                      if (isSelected) seatClass = 'seat-selected';

                      return (
                        <div
                          key={col}
                          onClick={() => handleSeatClick(seatObj)}
                          className={seatClass}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '5px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '9px',
                            fontWeight: 'bold',
                            userSelect: 'none'
                          }}
                        >
                          {col}
                        </div>
                      );
                    })}
                  </Box>
                  <Typography variant="body2" color="textSecondary" style={{ width: '20px', fontWeight: 'bold', textAlign: 'right' }}>{row}</Typography>
                </Box>
              ))}
            </Box>

          </Box>
        </Grid>

      </Grid>
    </Container>
  );
};

export default GroupBookingPage;
