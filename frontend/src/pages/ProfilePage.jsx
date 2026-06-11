import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { CreditCard, Award, Gift, Bell, User as UserIcon, Calendar, Clock, MapPin, CheckCircle, Ticket, Wallet } from 'lucide-react';
import { Container, Grid, Box, Typography, Button, Paper, Tabs, Tab, Divider, TextField, Radio, RadioGroup, FormControlLabel, FormControl } from '@mui/material';
import { API, fetchUserProfile } from '../store';

const ProfilePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const queryParams = new URLSearchParams(location.search);
  const checkoutId = queryParams.get('checkout');
  const checkoutGroupCode = queryParams.get('checkoutGroup');
  const activeTabQuery = queryParams.get('tab') || 'orders';

  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [giftCards, setGiftCards] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Checkout form states
  const [checkoutBooking, setCheckoutBooking] = useState(null);
  const [checkoutGroup, setCheckoutGroup] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState('');
  
  // Gift Card purchase inputs
  const [newGcVal, setNewGcVal] = useState(50);

  // Admin Loyalty States
  const [loyaltyStats, setLoyaltyStats] = useState(null);
  const [pointsPerBooking, setPointsPerBooking] = useState(10);
  const [firstBookingBonus, setFirstBookingBonus] = useState(50);
  const [campaignActive, setCampaignActive] = useState(false);
  const [campaignBonusPoints, setCampaignBonusPoints] = useState(20);
  const [campaignName, setCampaignName] = useState('Summer Festival Bonus');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Map URL queries to tabs
    if (['orders', 'rewards', 'giftcards', 'notifications', 'settings'].includes(activeTabQuery)) {
      setActiveTab(activeTabQuery);
    }
  }, [activeTabQuery]);

  // Load orders / profile data
  useEffect(() => {
    if (isAuthenticated) {
      API.get('/bookings/').then((res) => setOrders(res.data.results || res.data)).catch(() => {});
      API.get('/auth/rewards/').then((res) => setRewards(res.data.results || res.data)).catch(() => {});
      API.get('/giftcards/').then((res) => setGiftCards(res.data.results || res.data)).catch(() => {});
      API.get('/auth/notifications/').then((res) => setNotifications(res.data.results || res.data)).catch(() => {});
      dispatch(fetchUserProfile());
    }
  }, [isAuthenticated, activeTab]);

  // Load target checkout details if requested in URL
  useEffect(() => {
    if (checkoutId) {
      API.get(`/bookings/`)
        .then((res) => {
          const list = res.data.results || res.data;
          const match = list.find(b => b.booking_id === checkoutId);
          if (match) setCheckoutBooking(match);
        });
    }
    if (checkoutGroupCode) {
      API.get(`/group/detail/${checkoutGroupCode}/`)
        .then((res) => {
          setCheckoutGroup(res.data);
        });
    }
  }, [checkoutId, checkoutGroupCode]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    navigate(`/profile?tab=${newValue}`);
  };

  useEffect(() => {
    if (isAuthenticated && activeTab === 'admin_loyalty' && user?.role === 'Admin') {
      API.get('/loyalty/stats/')
        .then((res) => {
          setLoyaltyStats(res.data);
        })
        .catch(() => {});
      
      API.get('/loyalty/config/')
        .then((res) => {
          setPointsPerBooking(res.data.points_per_booking);
          setFirstBookingBonus(res.data.first_booking_bonus);
          setCampaignActive(res.data.campaign_active);
          setCampaignBonusPoints(res.data.campaign_bonus_points);
          setCampaignName(res.data.campaign_name);
        })
        .catch(() => {});
    }
  }, [isAuthenticated, activeTab, user]);

  const handleSaveLoyaltyConfig = () => {
    API.patch('/loyalty/config/', {
      points_per_booking: pointsPerBooking,
      first_booking_bonus: firstBookingBonus,
      campaign_active: campaignActive,
      campaign_bonus_points: campaignBonusPoints,
      campaign_name: campaignName
    })
      .then(() => {
        alert('Loyalty settings updated successfully!');
        return API.get('/loyalty/config/');
      })
      .then((res) => {
        setPointsPerBooking(res.data.points_per_booking);
        setFirstBookingBonus(res.data.first_booking_bonus);
        setCampaignActive(res.data.campaign_active);
        setCampaignBonusPoints(res.data.campaign_bonus_points);
        setCampaignName(res.data.campaign_name);
      })
      .catch(() => alert('Failed to update settings.'));
  };

  const handleGiftCardPurchase = (e) => {
    e.preventDefault();
    API.post('/giftcards/purchase/', { value: newGcVal })
      .then((res) => {
        alert(`Gift Card purchased! Code: ${res.data.code}`);
        setNewGcVal(50);
        return API.get('/giftcards/');
      })
      .then((res) => setGiftCards(res.data.results || res.data))
      .catch(() => alert('Failed to purchase gift card.'));
  };

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    
    if (checkoutBooking) {
      setCheckoutBooking(null);
      navigate(`/checkout/${checkoutBooking.booking_id}`);
    }

    if (checkoutGroup) {
      API.post('/group/pay/', {
        invite_code: checkoutGroup.invite_code
      })
        .then((res) => {
          const bookingId = res.data.booking.booking_id;
          setCheckoutGroup(null);
          navigate(`/checkout/${bookingId}`);
        })
        .catch((err) => {
          alert(err.response?.data?.error || 'Failed to initialize group payment.');
        });
    }
  };

  return (
    <Container maxWidth="lg" style={{ marginTop: '40px' }}>
      
      {/* 1. Checkout Panel Overlay if active */}
      {(checkoutBooking || checkoutGroup) && (
        <Paper p={4} className="glass-panel" style={{ padding: '30px', marginBottom: '40px', border: '2px solid #7C3AED' }}>
          <Typography variant="h5" fontWeight={800} gutterBottom display="flex" alignItems="center" gap="10px">
            <Wallet size={24} color="#EC4899" />
            CineHub Secure Checkout
          </Typography>
          <Divider style={{ background: 'rgba(255,255,255,0.08)', margin: '14px 0' }} />

          <Grid container spacing={4}>
            {/* Show details */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" fontWeight={700} gutterBottom>Show Details</Typography>
              {checkoutBooking && (
                <Box mt={2}>
                  <Typography variant="h5" color="primary" fontWeight={800}>
                    {checkoutBooking.show_detail?.movie_detail?.title || (checkoutBooking.show_detail?.event_title || checkoutBooking.show_detail?.sports_title)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" mt={1}>
                    Seats: <strong>{checkoutBooking.seats_display}</strong>
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Base Price: <strong>₹{checkoutBooking.total_price}</strong>
                  </Typography>
                </Box>
              )}

              {checkoutGroup && (
                <Box mt={2}>
                  <Typography variant="h5" color="primary" fontWeight={800}>
                    Group Booking: {checkoutGroup.show_detail?.movie_detail?.title || (checkoutGroup.show_detail?.event_title || checkoutGroup.show_detail?.sports_title)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" mt={1}>
                    Total Seats: <strong>
                      {checkoutGroup.members.reduce((acc, m) => acc.concat(m.seats_display.split(',')), []).join(', ')}
                    </strong>
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Group Code: <strong>{checkoutGroup.invite_code}</strong>
                  </Typography>
                </Box>
              )}
            </Grid>

            {/* Payment inputs */}
            <Grid item xs={12} md={6} component="form" onSubmit={handleCheckoutSubmit}>
              <Typography variant="h6" fontWeight={700} mb={2}>Select Payment Method</Typography>
              
              <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ display: 'flex', gap: '8px' }}>
                <FormControlLabel value="UPI" control={<Radio color="secondary" />} label="UPI (GooglePay, PhonePe)" />
                <FormControlLabel value="Credit Card" control={<Radio color="secondary" />} label="Credit Card" />
                <FormControlLabel value="Debit Card" control={<Radio color="secondary" />} label="Debit Card" />
                <FormControlLabel value="Net Banking" control={<Radio color="secondary" />} label="Net Banking" />
              </RadioGroup>

              {/* Reward points deduction / Gift Card */}
              {checkoutBooking && (
                <Box mt={3} p={2} borderRadius="8px" background="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.05)">
                  <Typography variant="body2" fontWeight={700} mb={1}>Discounts & Gift Cards</Typography>
                  
                  <FormControlLabel
                    control={
                      <Radio
                        checked={redeemPoints}
                        onClick={() => setRedeemPoints(!redeemPoints)}
                        color="primary"
                      />
                    }
                    label={`Redeem Reward Points (Available: ${user?.total_reward_points} pts)`}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Enter Gift Card Code (e.g. CINE100)"
                    value={giftCardCode}
                    onChange={(e) => setGiftCardCode(e.target.value)}
                    InputProps={{ style: { background: 'rgba(0,0,0,0.2)', color: '#FFF', fontSize: '13px', marginTop: '10px' } }}
                  />
                </Box>
              )}

              <Box display="flex" gap="12px" mt={4}>
                <Button type="submit" variant="contained" className="bg-gradient-primary" fullWidth style={{ padding: '12px', fontWeight: 800 }}>
                  Confirm Payment
                </Button>
                <Button variant="outlined" color="secondary" onClick={() => { setCheckoutBooking(null); setCheckoutGroup(null); }} style={{ fontWeight: 700 }}>
                  Cancel
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* 2. User summary header */}
      <Box p={4} className="glass-panel" mb={4} display="flex" justifyContent="space-between" flexWrap="wrap" gap="20px" alignItems="center">
        <Box display="flex" alignItems="center" gap="16px">
          <Box className="glow-purple" display="flex" alignItems="center" justifyContent="center" width="60px" height="60px" borderRadius="50%" background="#7C3AED" fontSize="24px" fontWeight={800}>
            {user?.full_name ? user.full_name[0].toUpperCase() : <UserIcon />}
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800}>{user?.full_name}</Typography>
            <Typography variant="body2" color="textSecondary">{user?.email}</Typography>
          </Box>
        </Box>
        
        {/* Reward card block */}
        <Box display="flex" alignItems="center" gap="14px" p="16px 24px" borderRadius="12px" background="linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)" border="1px solid rgba(124, 58, 237, 0.3)">
          <Award size={32} color="#EC4899" />
          <Box>
            <Typography variant="caption" color="textSecondary" display="block">REWARD BALANCE</Typography>
            <Typography variant="h6" fontWeight={800} color="primary">{user?.total_reward_points} Tokens</Typography>
          </Box>
        </Box>
      </Box>

      {/* 3. Account tabs */}
      <Box sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          textColor="secondary"
          indicatorColor="secondary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: '24px' }}
        >
          <Tab value="orders" label="Your Orders" icon={<Ticket size={16} />} iconPosition="start" />
          <Tab value="rewards" label="Reward Points" icon={<Award size={16} />} iconPosition="start" />
          <Tab value="giftcards" label="Gift Cards" icon={<Gift size={16} />} iconPosition="start" />
          <Tab value="notifications" label="Notifications" icon={<Bell size={16} />} iconPosition="start" />
          <Tab value="settings" label="Settings" icon={<UserIcon size={16} />} iconPosition="start" />
          {user?.role === 'Admin' && (
            <Tab value="admin_loyalty" label="Admin Loyalty" icon={<Award size={16} />} iconPosition="start" />
          )}
        </Tabs>

        {/* Tab 1: Orders */}
        {activeTab === 'orders' && (
          orders.length === 0 ? (
            <NoDataMsg message="You haven't booked any tickets yet." />
          ) : (
            <Grid container spacing={3}>
              {orders.map((order) => {
                const showD = order.show_detail || {};
                const showTitle = showD.movie_detail?.title || (showD.event_title || showD.sports_title);
                const showPlace = showD.theatre_detail ? showD.theatre_detail.name : (showD.venue_name || "Cinema Hall");
                const dateObj = new Date(showD.start_time);
                const formattedDate = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <Grid item xs={12} key={order.id}>
                    <Paper p={3} className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                      <Box display="flex" gap="20px" alignItems="start">
                        <Ticket size={36} color="#7C3AED" />
                        <Box>
                          <Typography variant="h6" fontWeight={700}>{showTitle}</Typography>
                          <Typography variant="body2" color="textSecondary" mt={0.5}>{showPlace}</Typography>
                          <Box display="flex" gap="14px" mt={1}>
                            <Typography variant="caption" color="textSecondary">Date: {formattedDate}</Typography>
                            <Typography variant="caption" color="textSecondary">Time: {formattedTime}</Typography>
                          </Box>
                          <Typography variant="body2" mt={1}>
                            Seats: <strong>{order.seats_display}</strong>
                          </Typography>
                        </Box>
                      </Box>
                      
                      {/* Ticket payment action or ticket details */}
                      <Box display="flex" flexDirection="column" alignItems="flex-end" justifyContent="space-between">
                        <Box textAlign="right">
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 'bold',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            background: order.status === 'Confirmed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: order.status === 'Confirmed' ? '#10B981' : '#F59E0B',
                            border: `1px solid ${order.status === 'Confirmed' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                          }}>
                            {order.status}
                          </span>
                          <Typography variant="h6" fontWeight={800} mt={1}>₹{order.total_price}</Typography>
                        </Box>

                        {order.status === 'Pending' && (
                          <Button
                            size="small"
                            variant="contained"
                            color="warning"
                            onClick={() => navigate(`/profile?checkout=${order.booking_id}`)}
                            style={{ marginTop: '12px', fontWeight: 700 }}
                          >
                            Pay & Confirm Seats
                          </Button>
                        )}

                        {order.status === 'Confirmed' && order.qr_code_url && (
                          <Box mt={2} textAlign="center">
                            <img src={order.qr_code_url} alt="QR Code Ticket" style={{ width: '80px', height: '80px', borderRadius: '4px', border: '2px solid #FFFFFF' }} />
                            <Typography variant="caption" display="block" color="textSecondary" style={{ fontSize: '10px', marginTop: '4px' }}>
                              ID: {order.booking_id}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )
        )}

        {/* Tab 2: Reward Points */}
        {activeTab === 'rewards' && (
          <Box display="flex" flexDirection="column" gap="24px">
            {/* Rewards Stats Header */}
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Paper className="glass-panel" style={{ padding: '20px', textAlign: 'center', border: '1px solid rgba(236,72,153,0.2)' }}>
                  <Typography variant="caption" color="textSecondary" display="block" style={{ fontWeight: 800, letterSpacing: '1px' }}>CURRENT BALANCE</Typography>
                  <Typography variant="h4" fontWeight={900} color="primary" mt={1}>{user?.total_reward_points || 0} pts</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper className="glass-panel" style={{ padding: '20px', textAlign: 'center', border: '1px solid rgba(250,204,21,0.2)' }}>
                  <Typography variant="caption" color="textSecondary" display="block" style={{ fontWeight: 800, letterSpacing: '1px' }}>LIFETIME EARNED</Typography>
                  <Typography variant="h4" fontWeight={900} style={{ color: '#FACC15' }} mt={1}>{user?.lifetime_points || 0} pts</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper className="glass-panel" style={{ padding: '20px', textAlign: 'center', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <Typography variant="caption" color="textSecondary" display="block" style={{ fontWeight: 800, letterSpacing: '1px' }}>LOYALTY TIER</Typography>
                  <Typography variant="h4" fontWeight={900} style={{ color: user?.loyalty_tier === 'Platinum' ? '#EC4899' : (user?.loyalty_tier === 'Gold' ? '#FACC15' : '#94A3B8') }} mt={1}>
                    {user?.loyalty_tier || 'Silver'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Progress Bar to Next Tier */}
            {user?.loyalty_tier !== 'Platinum' ? (
              <Paper className="glass-panel" style={{ padding: '24px' }}>
                <Box display="flex" justifyContent="space-between" mb={1.5}>
                  <Typography variant="body2" fontWeight={700}>Tier Progress to {user?.loyalty_tier === 'Silver' ? 'Gold' : 'Platinum'}</Typography>
                  <Typography variant="body2" color="textSecondary">{user?.points_to_next_tier} points to next tier</Typography>
                </Box>
                <div style={{ height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{
                    height: '100%',
                    width: `${user?.loyalty_tier === 'Silver' ? Math.min(((user?.total_reward_points || 0) / 500) * 100, 100) : Math.min((((user?.total_reward_points || 500) - 500) / 1000) * 100, 100)}%`,
                    background: 'linear-gradient(90deg, #EC4899 0%, #FACC15 100%)',
                    borderRadius: '5px'
                  }} />
                </div>
              </Paper>
            ) : (
              <Paper className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(236,72,153,0.1) 0%, rgba(250,204,21,0.1) 100%)', border: '1px solid rgba(236,72,153,0.3)' }}>
                <Typography variant="h6" fontWeight={800} color="primary" display="flex" alignItems="center" gap="6px" gutterBottom>
                  <CheckCircle size={18} /> Platinum Tier Unlocked!
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Congratulations! You've unlocked the highest tier on CineHub. Enjoy extra discounts, priority bookings, and free premium seat upgrades!
                </Typography>
              </Paper>
            )}

            {/* Points History */}
            <Paper p={3} className="glass-panel" style={{ padding: '24px' }}>
              <Typography variant="h6" fontWeight={700} mb={3}>Points History</Typography>
              {rewards.length === 0 ? (
                <Typography variant="body2" color="textSecondary">No reward transactions logged yet.</Typography>
              ) : (
                rewards.map((trans) => (
                  <Box key={trans.id} display="flex" justifyContent="space-between" py={2} borderBottom="1px solid rgba(255,255,255,0.05)">
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{trans.description}</Typography>
                      <Typography variant="caption" color="textSecondary">{new Date(trans.created_at).toLocaleDateString()}</Typography>
                    </Box>
                    <Typography variant="body1" fontWeight={800} style={{ color: trans.points >= 0 ? '#10B981' : '#EF4444' }}>
                      {trans.points >= 0 ? `+${trans.points}` : trans.points} pts
                    </Typography>
                  </Box>
                ))
              )}
            </Paper>
          </Box>
        )}

        {/* Tab 3: Gift Cards */}
        {activeTab === 'giftcards' && (
          <Grid container spacing={4}>
            
            {/* Purchase Form */}
            <Grid item xs={12} md={5}>
              <Paper p={3} className="glass-panel" style={{ padding: '24px' }} component="form" onSubmit={handleGiftCardPurchase}>
                <Typography variant="h6" fontWeight={700} mb={2}>Purchase Gift Card</Typography>
                <Typography variant="body2" color="textSecondary" mb={3}>Buy standard vouchers for friends or to apply discount tokens on bookings.</Typography>
                
                <RadioGroup row value={newGcVal} onChange={(e) => setNewGcVal(Number(e.target.value))} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  {[25, 50, 100].map((v) => (
                    <FormControlLabel key={v} value={v} control={<Radio color="secondary" />} label={`₹${v}`} />
                  ))}
                </RadioGroup>

                <Button type="submit" variant="contained" className="bg-gradient-primary" fullWidth style={{ borderRadius: '8px', fontWeight: 700 }}>
                  Purchase Gift Card
                </Button>
              </Paper>
            </Grid>

            {/* List */}
            <Grid item xs={12} md={7}>
              <Paper p={3} className="glass-panel" style={{ padding: '24px' }}>
                <Typography variant="h6" fontWeight={700} mb={3}>Your Purchased Gift Cards</Typography>
                {giftCards.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">No gift cards purchased yet.</Typography>
                ) : (
                  giftCards.map((gc) => (
                    <Box key={gc.id} display="flex" justifyContent="space-between" py={2} borderBottom="1px solid rgba(255,255,255,0.05)" alignItems="center">
                      <Box>
                        <Typography variant="body2" style={{ fontFamily: 'monospace', fontSize: '16px', letterSpacing: '1px' }}>
                          <strong>{gc.code}</strong>
                        </Typography>
                        <Typography variant="caption" color="textSecondary">Value: ₹{gc.value}</Typography>
                      </Box>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 'bold',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: gc.is_redeemed ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: gc.is_redeemed ? '#EF4444' : '#10B981',
                        border: `1px solid ${gc.is_redeemed ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                      }}>
                        {gc.is_redeemed ? 'Redeemed' : 'Active'}
                      </span>
                    </Box>
                  ))
                )}
              </Paper>
            </Grid>

          </Grid>
        )}

        {/* Tab 4: Notifications */}
        {activeTab === 'notifications' && (
          notifications.length === 0 ? (
            <NoDataMsg message="No alerts received." />
          ) : (
            <Paper p={3} className="glass-panel" style={{ padding: '24px' }}>
              <Typography variant="h6" fontWeight={700} mb={3}>Alerts Feed</Typography>
              {notifications.map((noti) => (
                <Box key={noti.id} py={2} borderBottom="1px solid rgba(255,255,255,0.05)">
                  <Typography variant="body2" fontWeight={700}>{noti.title}</Typography>
                  <Typography variant="body2" color="textSecondary" mt={0.5}>{noti.message}</Typography>
                  <Typography variant="caption" color="textSecondary" display="block" mt={0.5}>{new Date(noti.created_at).toLocaleDateString()}</Typography>
                </Box>
              ))}
            </Paper>
          )
        )}

        {/* Tab 5: Settings */}
        {activeTab === 'settings' && (
          <Paper p={3} className="glass-panel" style={{ padding: '24px', maxWidth: '500px' }}>
            <Typography variant="h6" fontWeight={700} mb={3}>Account Settings</Typography>
            <Box display="flex" flexDirection="column" gap="20px">
              <TextField fullWidth disabled label="Email Address" value={user?.email || ''} InputProps={{ style: { color: '#FFF' } }} />
              <TextField fullWidth disabled label="Full Name" value={user?.full_name || ''} InputProps={{ style: { color: '#FFF' } }} />
              <TextField fullWidth disabled label="Phone Number" value={user?.phone_number || ''} InputProps={{ style: { color: '#FFF' } }} />
            </Box>
          </Paper>
        )}

        {/* Tab: Admin Loyalty */}
        {activeTab === 'admin_loyalty' && user?.role === 'Admin' && (
          <Grid container spacing={4}>
            {/* Stats Panel */}
            <Grid item xs={12} md={6}>
              <Paper className="glass-panel" style={{ padding: '24px' }}>
                <Typography variant="h6" fontWeight={700} mb={3}>Loyalty Program Statistics</Typography>
                
                {loyaltyStats ? (
                  <Box display="flex" flexDirection="column" gap="16px">
                    <Box display="flex" justifyContent="space-between" pb={1} borderBottom="1px solid rgba(255,255,255,0.05)">
                      <Typography variant="body2" color="textSecondary">Total Customers Checked</Typography>
                      <Typography variant="body2" fontWeight={800}>{loyaltyStats.total_customers}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" pb={1} borderBottom="1px solid rgba(255,255,255,0.05)">
                      <Typography variant="body2" color="textSecondary">Silver Tier Users</Typography>
                      <Typography variant="body2" fontWeight={800} style={{ color: '#94A3B8' }}>{loyaltyStats.silver_tier_count}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" pb={1} borderBottom="1px solid rgba(255,255,255,0.05)">
                      <Typography variant="body2" color="textSecondary">Gold Tier Users</Typography>
                      <Typography variant="body2" fontWeight={800} style={{ color: '#FACC15' }}>{loyaltyStats.gold_tier_count}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" pb={1} borderBottom="1px solid rgba(255,255,255,0.05)">
                      <Typography variant="body2" color="textSecondary">Platinum Tier Users</Typography>
                      <Typography variant="body2" fontWeight={800} style={{ color: '#EC4899' }}>{loyaltyStats.platinum_tier_count}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" pb={1} borderBottom="1px solid rgba(255,255,255,0.05)">
                      <Typography variant="body2" color="textSecondary">Total Points Issued</Typography>
                      <Typography variant="body2" fontWeight={800} color="primary">{loyaltyStats.total_points_distributed} pts</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="textSecondary">Total Points Redeemed</Typography>
                      <Typography variant="body2" fontWeight={800} style={{ color: '#EF4444' }}>{loyaltyStats.total_points_redeemed} pts</Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box textAlign="center" py={4}>
                    <CircularProgress size={30} style={{ color: '#EC4899' }} />
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Configuration Form */}
            <Grid item xs={12} md={6}>
              <Paper className="glass-panel" style={{ padding: '24px' }}>
                <Typography variant="h6" fontWeight={700} mb={3}>Configure Loyalty Settings</Typography>
                
                <Box display="flex" flexDirection="column" gap="20px">
                  <TextField 
                    fullWidth 
                    label="Points per ticket booking" 
                    type="number"
                    value={pointsPerBooking}
                    onChange={(e) => setPointsPerBooking(parseInt(e.target.value))}
                    InputProps={{ style: { color: '#FFF' } }} 
                  />
                  <TextField 
                    fullWidth 
                    label="Bonus on first booking" 
                    type="number"
                    value={firstBookingBonus}
                    onChange={(e) => setFirstBookingBonus(parseInt(e.target.value))}
                    InputProps={{ style: { color: '#FFF' } }} 
                  />

                  <Divider style={{ background: 'rgba(255,255,255,0.08)' }} />
                  
                  <Typography variant="subtitle2" fontWeight={800} color="primary">Bonus Campaign Settings</Typography>

                  <FormControlLabel
                    control={
                      <Radio
                        checked={campaignActive}
                        onClick={() => setCampaignActive(!campaignActive)}
                        color="primary"
                      />
                    }
                    label="Enable Active Bonus Campaign"
                  />

                  <TextField 
                    fullWidth 
                    label="Campaign Name" 
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    disabled={!campaignActive}
                    InputProps={{ style: { color: '#FFF' } }} 
                  />

                  <TextField 
                    fullWidth 
                    label="Campaign Bonus Points" 
                    type="number"
                    value={campaignBonusPoints}
                    onChange={(e) => setCampaignBonusPoints(parseInt(e.target.value))}
                    disabled={!campaignActive}
                    InputProps={{ style: { color: '#FFF' } }} 
                  />

                  <Button 
                    variant="contained" 
                    className="bg-gradient-primary" 
                    fullWidth 
                    onClick={handleSaveLoyaltyConfig}
                    style={{ color: '#0B0F19', fontWeight: 800, padding: '12px', marginTop: '8px' }}
                  >
                    Save Settings
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}

      </Box>
    </Container>
  );
};

const NoDataMsg = ({ message }) => (
  <Paper p={4} className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
    <Typography variant="body1" color="textSecondary">{message}</Typography>
  </Paper>
);

export default ProfilePage;
