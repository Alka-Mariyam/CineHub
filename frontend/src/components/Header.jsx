import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search, MapPin, User, Bell, LogOut, Settings, CreditCard, Award, Gift, Shield,
  Film, Play, Music, Sparkles, Trophy, Compass, Tag, MoreHorizontal
} from 'lucide-react';
import {
  AppBar, Toolbar, IconButton, Badge, Menu, MenuItem, ListItemIcon,
  ListItemText, TextField, Select, InputAdornment, Button, Box, useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { setSelectedCity, setSearchQuery, setSearchCategory, logout, API } from '../store';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { selectedCity, allLocations } = useSelector((state) => state.location);
  const { query, category } = useSelector((state) => state.search);

  const [profileAnchor, setProfileAnchor] = useState(null);
  const [notiAnchor, setNotiAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [cities, setCities] = useState(['Mumbai', 'Bengaluru', 'New Delhi', 'Kolkata']);

  // Categories list
  const categories = [
    'Movies', 'Stream', 'Events', 'Plays', 'Sports',
    'Activities', 'Venues', 'Offers', 'Others'
  ];

  const categoryIcons = {
    'Movies': <Film size={15} />,
    'Stream': <Play size={15} />,
    'Events': <Music size={15} />,
    'Plays': <Sparkles size={15} />,
    'Sports': <Trophy size={15} />,
    'Activities': <Compass size={15} />,
    'Venues': <MapPin size={15} />,
    'Offers': <Tag size={15} />,
    'Others': <MoreHorizontal size={15} />
  };

  useEffect(() => {
    // Load notifications if logged in
    if (isAuthenticated) {
      API.get('/auth/notifications/')
        .then((res) => setNotifications(res.data.results || res.data))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const handleProfileOpen = (e) => setProfileAnchor(e.currentTarget);
  const handleProfileClose = () => setProfileAnchor(null);
  const handleNotiOpen = (e) => setNotiAnchor(e.currentTarget);
  const handleNotiClose = () => setNotiAnchor(null);

  const handleLogout = () => {
    dispatch(logout());
    handleProfileClose();
    navigate('/');
  };

  const handleCategoryClick = (cat) => {
    dispatch(setSearchCategory(cat));
    navigate('/');
  };

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const randomCity = cities[Math.floor(Math.random() * cities.length)];
          dispatch(setSelectedCity(randomCity));
          alert(`Detected location: ${randomCity} (Latitude: ${position.coords.latitude.toFixed(2)}, Longitude: ${position.coords.longitude.toFixed(2)})`);
        },
        () => {
          dispatch(setSelectedCity('Mumbai'));
        }
      );
    }
  };

  return (
    <AppBar position="sticky" style={{ background: 'rgba(11, 15, 25, 0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <Toolbar style={{ display: 'flex', flexDirection: 'column', padding: isMobile ? '10px 16px' : '10px 24px', gap: '12px' }}>
        
        {/* Top Row */}
        <Box display="flex" width="100%" alignItems="center" justifyContent="space-between" gap="16px">
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none' }}>
              <Box display="flex" alignItems="center" gap="6px">
                <span style={{ fontSize: isMobile ? '24px' : '28px' }}>🍿</span>
                <span className="text-gradient" style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '800', letterSpacing: '1px' }}>
                  CineHub
                </span>
              </Box>
            </Link>


          {/* Global Search Bar (Desktop) */}
          {!isMobile && (
            <Box flex={1} maxWidth="500px" mx="20px">
              <TextField
                size="small"
                fullWidth
                placeholder={`Search ${category}...`}
                value={query}
                onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={18} color="#94A3B8" />
                    </InputAdornment>
                  ),
                  style: {
                    background: 'rgba(22, 31, 48, 0.6)',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                  }
                }}
              />
            </Box>
          )}

          {/* Right Controls */}
          <Box display="flex" alignItems="center" gap={isMobile ? '8px' : '16px'}>
            {/* Location Selector */}
            <Box display="flex" alignItems="center" gap="4px">
              <MapPin size={isMobile ? 15 : 18} color="#EC4899" />
              <Select
                size="small"
                variant="standard"
                value={selectedCity}
                onChange={(e) => dispatch(setSelectedCity(e.target.value))}
                disableUnderline
                style={{ color: '#FFFFFF', fontWeight: 600, fontSize: isMobile ? '12px' : '14px', cursor: 'pointer' }}
              >
                {cities.map((city) => (
                  <MenuItem key={city} value={city}>{city}</MenuItem>
                ))}
              </Select>
              {!isMobile && (
                <Button size="small" onClick={detectLocation} style={{ color: '#94A3B8', fontSize: '11px', minWidth: 'auto', padding: '0 4px' }}>
                  (Detect)
                </Button>
              )}
            </Box>

            {/* Notification Badge */}
            {isAuthenticated && (
              <>
                <IconButton onClick={handleNotiOpen} style={{ color: '#FFFFFF', padding: '6px' }}>
                  <Badge badgeContent={notifications.filter(n => !n.is_read).length} color="primary">
                    <Bell size={20} />
                  </Badge>
                </IconButton>
                <Menu
                  anchorEl={notiAnchor}
                  open={Boolean(notiAnchor)}
                  onClose={handleNotiClose}
                  PaperProps={{ style: { background: '#161F30', width: '320px', borderRadius: '12px' } }}
                >
                  <Box p={2} borderBottom="1px solid rgba(255,255,255,0.08)" fontWeight={600}>
                    Notifications
                  </Box>
                  {notifications.length === 0 ? (
                    <MenuItem disabled style={{ color: '#94A3B8', padding: '16px' }}>No notifications</MenuItem>
                  ) : (
                    notifications.map((n) => (
                      <MenuItem key={n.id} style={{ whiteSpace: 'normal', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '12px 16px' }}>
                        <Box display="flex" flexDirection="column">
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>{n.title}</span>
                          <span style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>{n.message}</span>
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </Menu>
              </>
            )}

            {/* Profile Dropdown */}
            {isAuthenticated ? (
              <>
                <IconButton onClick={handleProfileOpen} className="glow-pink" style={{ background: '#EC4899', color: '#FFFFFF', width: '32px', height: '32px', fontSize: '13px', fontWeight: 700 }}>
                  {user?.full_name ? user.full_name[0].toUpperCase() : <User size={18} />}
                </IconButton>
                <Menu
                  anchorEl={profileAnchor}
                  open={Boolean(profileAnchor)}
                  onClose={handleProfileClose}
                  PaperProps={{ style: { background: '#161F30', width: '260px', borderRadius: '12px', marginTop: '8px' } }}
                >
                  <Box p={2} borderBottom="1px solid rgba(255,255,255,0.08)">
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>{user?.full_name}</div>
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>{user?.email}</div>
                    <Box mt={1.5} display="flex" alignItems="center" gap="6px" p="6px 10px" borderRadius="6px" background="rgba(236, 72, 153, 0.15)" width="fit-content">
                      <Award size={16} color="#EC4899" />
                      <span style={{ fontSize: '13px', color: '#EC4899', fontWeight: 700 }}>{user?.total_reward_points} Points</span>
                    </Box>
                  </Box>

                  {user?.role && ['Manager', 'Admin'].includes(user.role) && (
                    <MenuItem onClick={() => { handleProfileClose(); navigate('/manager'); }} style={{ borderBottom: '1px dashed rgba(255,255,255,0.08)' }}>
                      <ListItemIcon><Shield size={16} color="#FACC15" /></ListItemIcon>
                      <ListItemText primary="Theatre Admin" style={{ color: '#FACC15', fontWeight: 800 }} />
                    </MenuItem>
                  )}

                  <MenuItem onClick={() => { handleProfileClose(); navigate('/profile?tab=orders'); }}>
                    <ListItemIcon><CreditCard size={16} /></ListItemIcon>
                    <ListItemText primary="Your Orders" />
                  </MenuItem>

                  <MenuItem onClick={() => { handleProfileClose(); navigate('/profile?tab=library'); }}>
                    <ListItemIcon><Settings size={16} /></ListItemIcon>
                    <ListItemText primary="Stream Library" />
                  </MenuItem>

                  <MenuItem onClick={() => { handleProfileClose(); navigate('/profile?tab=rewards'); }}>
                    <ListItemIcon><Award size={16} /></ListItemIcon>
                    <ListItemText primary="Rewards & Points" />
                  </MenuItem>

                  <MenuItem onClick={() => { handleProfileClose(); navigate('/profile?tab=giftcards'); }}>
                    <ListItemIcon><Gift size={16} /></ListItemIcon>
                    <ListItemText primary="Gift Cards" />
                  </MenuItem>

                  <MenuItem onClick={handleLogout} style={{ color: '#EF4444' }}>
                    <ListItemIcon><LogOut size={16} color="#EF4444" /></ListItemIcon>
                    <ListItemText primary="Logout" />
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                variant="contained"
                className="bg-gradient-primary"
                onClick={() => navigate('/login')}
                style={{ borderRadius: '8px', fontWeight: 700, padding: '6px 14px', fontSize: isMobile ? '12px' : '14px' }}
              >
                Sign In
              </Button>
            )}
          </Box>
        </Box>

        {/* Search Row (Mobile only) */}
        {isMobile && (
          <Box width="100%">
            <TextField
              size="small"
              fullWidth
              placeholder={`Search ${category}...`}
              value={query}
              onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} color="#94A3B8" />
                  </InputAdornment>
                ),
                style: {
                  background: 'rgba(22, 31, 48, 0.6)',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontSize: '13px'
                }
              }}
            />
          </Box>
        )}

        {/* Categories Bar */}
        <Box display="flex" width="100%" gap={isMobile ? '16px' : '24px'} overflow="auto" py="4px" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {categories.map((cat) => (
            <Box
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              display="flex"
              alignItems="center"
              gap="6px"
              style={{
                fontSize: isMobile ? '12px' : '13px',
                fontWeight: category === cat ? '700' : '500',
                color: category === cat ? '#FACC15' : '#94A3B8',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'color 0.2s',
                borderBottom: category === cat ? '2px solid #FACC15' : '2px solid transparent',
                paddingBottom: '4px'
              }}
            >
              {categoryIcons[cat]}
              <span>{cat}</span>
            </Box>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
