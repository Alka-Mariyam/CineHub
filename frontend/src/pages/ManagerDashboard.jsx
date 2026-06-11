import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Film, Monitor, Calendar, Clock, Coins, Ticket, Plus, Trash2, Edit2,
  Search, Scan, User, CheckCircle2, AlertTriangle, TrendingUp, BarChart3,
  ListFilter, X, RefreshCw, Layers, MapPin, Building
} from 'lucide-react';
import {
  Container, Grid, Box, Typography, Button, Paper, Divider, CircularProgress,
  Alert, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, InputLabel, FormControl, Chip, Snackbar
} from '@mui/material';
import { API } from '../store';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  // Data States
  const [movies, setMovies] = useState([]);
  const [screens, setScreens] = useState([]);
  const [shows, setShows] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [selectedTheatreId, setSelectedTheatreId] = useState('');
  const [locations, setLocations] = useState([]);
  const [theatreModal, setTheatreModal] = useState({ open: false, mode: 'add', data: null });
  const [theatreForm, setTheatreForm] = useState({
    name: '', brand: '', location: '', address: '', contact_details: '', facilities: '', coordinates: ''
  });

  // Filter / Search States
  const [bookingSearch, setBookingSearch] = useState('');
  const [occupancyShowId, setOccupancyShowId] = useState('');
  const [occupancySeats, setOccupancySeats] = useState([]);
  const [occupancyLoading, setOccupancyLoading] = useState(false);

  // QR / Verification States
  const [verifyId, setVerifyId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  // Dialog / Edit States
  const [movieModal, setMovieModal] = useState({ open: false, mode: 'add', data: null });
  const [screenModal, setScreenModal] = useState({ open: false, mode: 'add', data: null });
  const [showModal, setShowModal] = useState({ open: false, mode: 'add', data: null });
  const [layoutModal, setLayoutModal] = useState({ open: false, screen: null, layout: {} });

  // Form Fields
  const [movieForm, setMovieForm] = useState({
    title: '', poster: '', trailer: '', language: '', duration: 120,
    genre: '', rating: 7.0, synopsis: '', mood: 'Happy', status: 'Now Showing'
  });
  const [screenForm, setScreenForm] = useState({ name: '', total_seats: 100 });
  const [showForm, setShowForm] = useState({ movie: '', screen: '', start_time: '', price: 150 });

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  const fetchData = async (targetId = selectedTheatreId) => {
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Fetch theatres first
      const theatresRes = await API.get('/admin/theatres/');
      const loadedTheatres = theatresRes.data.results || theatresRes.data;
      setTheatres(loadedTheatres);

      // Determine active theatre ID
      let activeId = targetId;
      if (!activeId && loadedTheatres.length > 0) {
        activeId = loadedTheatres[0].id;
        setSelectedTheatreId(activeId);
      }

      // 2. Fetch locations
      const locRes = await API.get('/auth/locations/');
      setLocations(locRes.data.results || locRes.data);

      const params = activeId ? { params: { theatre_id: activeId } } : {};

      const statsRes = await API.get('/admin/dashboard/', params);
      setStats(statsRes.data);

      const moviesRes = await API.get('/admin/movies/');
      setMovies(moviesRes.data.results || moviesRes.data);

      const screensRes = await API.get('/admin/screens/', params);
      setScreens(screensRes.data.results || screensRes.data);

      const showsRes = await API.get('/admin/shows/', params);
      setShows(showsRes.data.results || showsRes.data);

      const bookingsRes = await API.get('/admin/bookings/', params);
      setBookings(bookingsRes.data.results || bookingsRes.data);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Failed to load Theatre Admin data. Please ensure you are authorized.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [isAuthenticated]);

  const handleTheatreChange = (e) => {
    const nextId = e.target.value;
    setSelectedTheatreId(nextId);
    fetchData(nextId);
  };

  // Handle Tab Switch
  const handleTabChange = (e, newValue) => {
    setActiveTab(newValue);
    setVerifyResult(null);
    setVerifyId('');
  };

  // --- MOVIE CRUD OPERATORS ---
  const handleOpenMovieModal = (mode, movie = null) => {
    if (mode === 'edit' && movie) {
      setMovieForm({
        title: movie.title,
        poster: movie.poster,
        trailer: movie.trailer || '',
        language: movie.language,
        duration: movie.duration,
        genre: movie.genre,
        rating: movie.rating,
        synopsis: movie.synopsis,
        mood: movie.mood || 'Happy',
        status: movie.is_new_release ? 'Now Showing' : 'Coming Soon'
      });
      setMovieModal({ open: true, mode: 'edit', data: movie });
    } else {
      setMovieForm({
        title: '', poster: '', trailer: '', language: 'Hindi', duration: 120,
        genre: 'Action, Drama', rating: 7.5, synopsis: '', mood: 'Happy', status: 'Now Showing'
      });
      setMovieModal({ open: true, mode: 'add', data: null });
    }
  };

  const handleSaveMovie = async () => {
    try {
      const payload = {
        title: movieForm.title,
        poster: movieForm.poster,
        trailer: movieForm.trailer,
        language: movieForm.language,
        duration: parseInt(movieForm.duration),
        genre: movieForm.genre,
        rating: parseFloat(movieForm.rating),
        synopsis: movieForm.synopsis,
        mood: movieForm.mood,
        is_new_release: movieForm.status === 'Now Showing',
        is_trending: movieForm.status === 'Now Showing',
        is_recommended: movieForm.status === 'Now Showing'
      };

      if (movieModal.mode === 'edit') {
        await API.put(`/admin/movies/${movieModal.data.id}/`, payload);
        showToast('Movie updated successfully!');
      } else {
        await API.post('/admin/movies/', payload);
        showToast('Movie added successfully!');
      }
      setMovieModal({ open: false, mode: 'add', data: null });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save movie details.', 'error');
    }
  };

  const handleDeleteMovie = async (id) => {
    if (window.confirm("Are you sure you want to delete this movie?")) {
      try {
        await API.delete(`/admin/movies/${id}/`);
        showToast('Movie deleted successfully!');
        fetchData();
      } catch (err) {
        showToast('Failed to delete movie.', 'error');
      }
    }
  };

  // --- SCREEN CRUD OPERATORS ---
  const handleOpenScreenModal = (mode, screen = null) => {
    if (mode === 'edit' && screen) {
      setScreenForm({ name: screen.name, total_seats: screen.total_seats });
      setScreenModal({ open: true, mode: 'edit', data: screen });
    } else {
      setScreenForm({ name: '', total_seats: 100 });
      setScreenModal({ open: true, mode: 'add', data: null });
    }
  };

  const handleSaveScreen = async () => {
    try {
      const payload = {
        name: screenForm.name,
        total_seats: parseInt(screenForm.total_seats)
      };

      if (screenModal.mode === 'edit') {
        await API.patch(`/admin/screens/${screenModal.data.id}/`, payload);
        showToast('Screen updated successfully!');
      } else {
        payload.theatre = selectedTheatreId;
        // Default layout mapping rows A-J
        payload.seat_layout = {
          "A": "Silver", "B": "Silver", "C": "Silver", "D": "Silver",
          "E": "Gold", "F": "Gold", "G": "Gold",
          "H": "Platinum", "I": "Platinum", "J": "Platinum"
        };
        await API.post('/admin/screens/', payload);
        showToast('Screen added successfully!');
      }
      setScreenModal({ open: false, mode: 'add', data: null });
      fetchData();
    } catch (err) {
      showToast('Failed to save screen details.', 'error');
    }
  };

  const handleDeleteScreen = async (id) => {
    if (window.confirm("Are you sure you want to delete this screen?")) {
      try {
        await API.delete(`/admin/screens/${id}/`);
        showToast('Screen deleted successfully!');
        fetchData();
      } catch (err) {
        showToast('Failed to delete screen.', 'error');
      }
    }
  };

  // --- VISUAL SEAT LAYOUT EDITOR ---
  const handleOpenLayoutModal = (screen) => {
    setLayoutModal({
      open: true,
      screen: screen,
      layout: { ...screen.seat_layout }
    });
  };

  const handleRowCategoryChange = (row, category) => {
    setLayoutModal((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        [row]: category
      }
    }));
  };

  const handleSaveLayout = async () => {
    try {
      await API.patch(`/admin/screens/${layoutModal.screen.id}/`, {
        seat_layout: layoutModal.layout
      });
      showToast('Seat layout updated successfully!');
      setLayoutModal({ open: false, screen: null, layout: {} });
      fetchData();
    } catch (err) {
      showToast('Failed to update seat layout.', 'error');
    }
  };

  // --- THEATRE CRUD OPERATORS ---
  const handleOpenTheatreModal = (mode, theatre = null) => {
    if (mode === 'edit' && theatre) {
      setTheatreForm({
        name: theatre.name,
        brand: theatre.brand || '',
        location: theatre.location || '',
        address: theatre.address || '',
        contact_details: theatre.contact_details || '',
        facilities: theatre.facilities || '',
        coordinates: theatre.coordinates || ''
      });
      setTheatreModal({ open: true, mode: 'edit', data: theatre });
    } else {
      setTheatreForm({
        name: '', brand: '', location: '', address: '', contact_details: '', facilities: '', coordinates: ''
      });
      setTheatreModal({ open: true, mode: 'add', data: null });
    }
  };

  const handleSaveTheatre = async () => {
    try {
      const payload = {
        name: theatreForm.name,
        brand: theatreForm.brand,
        location: parseInt(theatreForm.location),
        address: theatreForm.address,
        contact_details: theatreForm.contact_details,
        facilities: theatreForm.facilities,
        coordinates: theatreForm.coordinates
      };

      if (theatreModal.mode === 'edit') {
        await API.patch(`/admin/theatres/${theatreModal.data.id}/`, payload);
        showToast('Theatre updated successfully!');
      } else {
        await API.post('/admin/theatres/', payload);
        showToast('Theatre added successfully!');
      }
      setTheatreModal({ open: false, mode: 'add', data: null });
      fetchData();
    } catch (err) {
      showToast('Failed to save theatre details.', 'error');
    }
  };

  const handleDeleteTheatre = async (id) => {
    if (window.confirm("Are you sure you want to delete this theatre? This will delete all screens and shows for this theatre!")) {
      try {
        await API.delete(`/admin/theatres/${id}/`);
        showToast('Theatre deleted successfully!');
        if (selectedTheatreId === id) {
          setSelectedTheatreId('');
          fetchData('');
        } else {
          fetchData();
        }
      } catch (err) {
        showToast('Failed to delete theatre.', 'error');
      }
    }
  };

  // --- SHOW CRUD OPERATORS ---
  const handleOpenShowModal = () => {
    setShowForm({ movie: '', screen: '', start_time: '', price: 150 });
    setShowModal({ open: true, mode: 'add', data: null });
  };

  const handleSaveShow = async () => {
    try {
      const start = new Date(showForm.start_time);
      const end = new Date(start.getTime() + 150 * 60000); // approximate 2.5 hour duration

      const payload = {
        movie: showForm.movie,
        screen: showForm.screen,
        theatre: selectedTheatreId,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        price: parseFloat(showForm.price)
      };

      await API.post('/admin/shows/', payload);
      showToast('Show scheduled and seats auto-generated successfully!');
      setShowModal({ open: false, mode: 'add', data: null });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create show schedule.', 'error');
    }
  };

  const handleDeleteShow = async (id) => {
    if (window.confirm("Deleting a show will cancel all seats and bookings. Continue?")) {
      try {
        await API.delete(`/admin/shows/${id}/`);
        showToast('Show cancelled successfully!');
        fetchData();
      } catch (err) {
        showToast('Failed to delete show.', 'error');
      }
    }
  };

  // --- SEAT OCCUPANCY LOADER ---
  const handleLoadOccupancy = (showId) => {
    setOccupancyShowId(showId);
    if (!showId) {
      setOccupancySeats([]);
      return;
    }
    setOccupancyLoading(true);
    API.get(`/admin/bookings/occupancy/?show=${showId}`)
      .then((res) => {
        setOccupancySeats(res.data);
        setOccupancyLoading(false);
      })
      .catch((err) => {
        showToast('Failed to load show occupancy.', 'error');
        setOccupancyLoading(false);
      });
  };

  // --- TICKET QR MANUAL/WEB CHECK-IN ---
  const handleVerifyTicket = () => {
    if (!verifyId.trim()) return;
    setVerifying(true);
    setVerifyResult(null);

    API.post('/admin/verify-ticket/', { booking_id: verifyId.trim() })
      .then((res) => {
        setVerifyResult({
          success: true,
          data: res.data
        });
        setVerifying(false);
        showToast('Ticket verified and user checked in!');
        fetchData(); // reload bookings list
      })
      .catch((err) => {
        setVerifyResult({
          success: false,
          error: err.response?.data?.error || 'Verification failed. Invalid Ticket ID.'
        });
        setVerifying(false);
      });
  };

  const filteredBookings = bookings.filter((b) =>
    b.booking_id.toLowerCase().includes(bookingSearch.toLowerCase()) ||
    b.user_detail?.email.toLowerCase().includes(bookingSearch.toLowerCase())
  );

  // Basic rendering helpers
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const getSeatColorClass = (seat) => {
    if (seat.status === 'Booked') return 'seat-booked';
    if (seat.status === 'Reserved') return 'seat-reserved';
    return 'seat-available';
  };

  if (loading && !stats) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="500px" flexDirection="column" gap="16px">
        <CircularProgress style={{ color: '#EC4899' }} />
        <Typography variant="h6" color="textSecondary">Loading Theatre Admin Module...</Typography>
      </Box>
    );
  }

  if (errorMsg) {
    return (
      <Container maxWidth="sm" style={{ marginTop: '80px' }}>
        <Paper className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <AlertTriangle size={48} color="#EF4444" style={{ marginBottom: '16px' }} />
          <Typography variant="h5" fontWeight={800} gutterBottom>Access Denied</Typography>
          <Typography variant="body2" color="textSecondary" mb={4}>{errorMsg}</Typography>
          <Button variant="contained" className="bg-gradient-primary" onClick={() => navigate('/')} style={{ color: '#0B0F19', fontWeight: 800 }}>
            Go Home
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" style={{ marginTop: '40px', marginBottom: '80px' }}>
      
      {/* Title Strip */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap="16px">
        <Box display="flex" alignItems="center" gap="12px">
          <Shield size={32} color="#FACC15" />
          <Box>
            <Typography variant="h4" fontWeight={900} className="text-gradient">Theatre Manager Portal</Typography>
            <Typography variant="body2" color="textSecondary" display="flex" alignItems="center" gap="10px">
              Managing: 
              {theatres.length > 1 ? (
                <Select
                  value={selectedTheatreId}
                  onChange={handleTheatreChange}
                  size="small"
                  variant="standard"
                  disableUnderline
                  style={{ color: '#FACC15', fontWeight: 900, cursor: 'pointer' }}
                >
                  {theatres.map((t) => (
                    <MenuItem key={t.id} value={t.id} style={{ background: '#161F30', color: '#FFF' }}>
                      {t.name} ({t.city})
                    </MenuItem>
                  ))}
                </Select>
              ) : (
                <strong style={{ color: '#FFF' }}>{stats?.theatre_name || 'CineHub Partner'}</strong>
              )}
            </Typography>
          </Box>
        </Box>
        <Button 
          startIcon={<RefreshCw size={16} />} 
          onClick={fetchData} 
          variant="outlined" 
          style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#FFF', borderRadius: '8px', textTransform: 'none' }}
        >
          Refresh Data
        </Button>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        textColor="primary"
        indicatorColor="primary"
        style={{ marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Tab label="Dashboard & Reports" style={{ fontWeight: 800, textTransform: 'none', fontSize: '15px' }} />
        <Tab label="Manage Movies" style={{ fontWeight: 800, textTransform: 'none', fontSize: '15px' }} />
        <Tab label="Manage Screens" style={{ fontWeight: 800, textTransform: 'none', fontSize: '15px' }} />
        <Tab label="Manage Shows" style={{ fontWeight: 800, textTransform: 'none', fontSize: '15px' }} />
        <Tab label="Bookings & Scanner" style={{ fontWeight: 800, textTransform: 'none', fontSize: '15px' }} />
        <Tab label="Manage Theatres" style={{ fontWeight: 800, textTransform: 'none', fontSize: '15px' }} />
      </Tabs>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
        >
          
          {/* TAB 0: DASHBOARD STATS & REPORTS */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              {/* Stat Cards */}
              <Grid item xs={6} md={2.4}>
                <Paper className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                  <Film size={24} color="#EC4899" style={{ marginBottom: '8px' }} />
                  <Typography variant="h4" fontWeight={900}>{stats?.total_movies}</Typography>
                  <Typography variant="caption" color="textSecondary" style={{ fontWeight: 700 }}>Total Movies</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2.4}>
                <Paper className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                  <Monitor size={24} color="#FACC15" style={{ marginBottom: '8px' }} />
                  <Typography variant="h4" fontWeight={900}>{stats?.total_screens}</Typography>
                  <Typography variant="caption" color="textSecondary" style={{ fontWeight: 700 }}>Total Screens</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2.4}>
                <Paper className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                  <Calendar size={24} color="#7C3AED" style={{ marginBottom: '8px' }} />
                  <Typography variant="h4" fontWeight={900}>{stats?.total_shows}</Typography>
                  <Typography variant="caption" color="textSecondary" style={{ fontWeight: 700 }}>Total Shows</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2.4}>
                <Paper className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                  <Ticket size={24} color="#10B981" style={{ marginBottom: '8px' }} />
                  <Typography variant="h4" fontWeight={900}>{stats?.total_bookings}</Typography>
                  <Typography variant="caption" color="textSecondary" style={{ fontWeight: 700 }}>Confirmed Bookings</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={2.4}>
                <Paper className="glass-panel" style={{ padding: '20px', textAlign: 'center', border: '1px solid rgba(250,204,21,0.2)' }}>
                  <Coins size={24} color="#FACC15" style={{ marginBottom: '8px' }} />
                  <Typography variant="h4" fontWeight={900} style={{ color: '#FACC15' }}>₹{stats?.total_revenue?.toLocaleString('en-IN')}</Typography>
                  <Typography variant="caption" color="textSecondary" style={{ fontWeight: 700 }}>Total Revenue</Typography>
                </Paper>
              </Grid>

              {/* Charts & Graphical Reports */}
              <Grid item xs={12} md={8}>
                <Paper className="glass-panel" style={{ padding: '30px', height: '380px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle1" fontWeight={900} display="flex" alignItems="center" gap="8px">
                      <TrendingUp size={18} color="#EC4899" />
                      Revenue Analysis Reports
                    </Typography>
                    <Typography variant="caption" color="textSecondary">Last 7 Days (Daily Revenue)</Typography>
                  </Box>
                  
                  {/* Basic Custom SVG/CSS Revenue Chart */}
                  <Box display="flex" alignItems="flex-end" justifyContent="space-between" height="240px" pt={2} px={1} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    {stats?.reports?.daily_revenue?.map((d, index) => {
                      const maxVal = Math.max(...stats.reports.daily_revenue.map(x => x.revenue)) || 1;
                      const percentage = Math.max((d.revenue / maxVal) * 100, 5);
                      return (
                        <Box key={index} display="flex" flexDirection="column" alignItems="center" style={{ flexGrow: 1, width: '100%', maxWidth: '50px' }}>
                          <Typography variant="caption" style={{ color: '#FACC15', fontSize: '10px', fontWeight: 800, marginBottom: '4px' }}>
                            {d.revenue > 0 ? `₹${d.revenue}` : '-'}
                          </Typography>
                          <div 
                            style={{ 
                              width: '60%', 
                              height: `${percentage * 1.8}px`, 
                              background: 'linear-gradient(to top, #EC4899 0%, #FACC15 100%)', 
                              borderRadius: '6px 6px 0 0',
                              transition: 'height 0.5s ease',
                              boxShadow: '0 0 10px rgba(236,72,153,0.3)'
                            }} 
                          />
                          <Typography variant="caption" color="textSecondary" style={{ fontSize: '9px', marginTop: '8px', whiteSpace: 'nowrap' }}>
                            {new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Paper>
              </Grid>

              {/* Most Booked Movies */}
              <Grid item xs={12} md={4}>
                <Paper className="glass-panel" style={{ padding: '30px', height: '380px', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle1" fontWeight={900} display="flex" alignItems="center" gap="8px" mb={3}>
                    <BarChart3 size={18} color="#FACC15" />
                    Top Performing Movies
                  </Typography>

                  <Box display="flex" flexDirection="column" gap="16px" flex={1} style={{ overflowY: 'auto' }}>
                    {stats?.reports?.most_booked_movies?.length === 0 ? (
                      <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
                        <Typography variant="body2" color="textSecondary">No bookings recorded yet.</Typography>
                      </Box>
                    ) : (
                      stats?.reports?.most_booked_movies?.map((m, idx) => (
                        <Box key={idx} display="flex" alignItems="center" justifyContent="space-between" p={1.5} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <Box display="flex" alignItems="center" gap="12px">
                            <div style={{ background: '#EC4899', color: '#0B0F19', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 900, fontSize: '12px' }}>
                              {idx + 1}
                            </div>
                            <Typography variant="body2" fontWeight={800} style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {m.title}
                            </Typography>
                          </Box>
                          <Chip 
                            label={`${m.bookings} Bookings`} 
                            size="small" 
                            style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontWeight: 700 }} 
                          />
                        </Box>
                      ))
                    )}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* TAB 1: MOVIE MANAGEMENT */}
          {activeTab === 1 && (
            <Box p={1} className="glass-panel" style={{ padding: '24px' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={800}>Movie Inventory</Typography>
                <Button 
                  startIcon={<Plus size={16} />} 
                  variant="contained" 
                  className="bg-gradient-primary"
                  onClick={() => handleOpenMovieModal('add')}
                  style={{ color: '#0B0F19', fontWeight: 800, textTransform: 'none', borderRadius: '8px' }}
                >
                  Add New Movie
                </Button>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow style={{ borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
                      <TableCell style={{ color: '#94A3B8', fontWeight: 800 }}>Movie Poster / Title</TableCell>
                      <TableCell style={{ color: '#94A3B8', fontWeight: 800 }}>Genre</TableCell>
                      <TableCell style={{ color: '#94A3B8', fontWeight: 800 }}>Language</TableCell>
                      <TableCell style={{ color: '#94A3B8', fontWeight: 800 }}>Duration</TableCell>
                      <TableCell style={{ color: '#94A3B8', fontWeight: 800 }}>Rating</TableCell>
                      <TableCell style={{ color: '#94A3B8', fontWeight: 800 }}>Status</TableCell>
                      <TableCell style={{ color: '#94A3B8', fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {movies.map((m) => (
                      <TableRow key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap="14px">
                            <img src={m.poster} alt={m.title} style={{ width: '40px', height: '55px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }} />
                            <Typography variant="subtitle2" fontWeight={800}>{m.title}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{m.genre}</TableCell>
                        <TableCell>{m.language}</TableCell>
                        <TableCell>{m.duration} mins</TableCell>
                        <TableCell style={{ color: '#FACC15', fontWeight: 700 }}>★ {m.rating}</TableCell>
                        <TableCell>
                          <Chip 
                            label={m.is_new_release ? 'Now Showing' : 'Coming Soon'} 
                            size="small" 
                            style={{ 
                              background: m.is_new_release ? 'rgba(16, 185, 129, 0.15)' : 'rgba(124, 58, 237, 0.15)', 
                              color: m.is_new_release ? '#10B981' : '#A78BFA',
                              fontWeight: 700
                            }} 
                          />
                        </TableCell>
                        <TableCell style={{ textAlign: 'right' }}>
                          <IconButton onClick={() => handleOpenMovieModal('edit', m)} style={{ color: '#FACC15', padding: '6px' }}>
                            <Edit2 size={16} />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteMovie(m.id)} style={{ color: '#EF4444', padding: '6px' }}>
                            <Trash2 size={16} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* TAB 2: SCREEN MANAGEMENT */}
          {activeTab === 2 && (
            <Grid container spacing={3}>
              {/* Screen List */}
              <Grid item xs={12} md={7}>
                <Paper className="glass-panel" style={{ padding: '24px' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6" fontWeight={800}>Theatre Screens</Typography>
                    <Button 
                      startIcon={<Plus size={16} />} 
                      variant="contained" 
                      className="bg-gradient-primary"
                      onClick={() => handleOpenScreenModal('add')}
                      style={{ color: '#0B0F19', fontWeight: 800, textTransform: 'none', borderRadius: '8px' }}
                    >
                      Add Screen
                    </Button>
                  </Box>

                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow style={{ borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
                          <TableCell style={{ color: '#94A3B8', fontWeight: 800 }}>Screen Name</TableCell>
                          <TableCell style={{ color: '#94A3B8', fontWeight: 800 }}>Capacity</TableCell>
                          <TableCell style={{ color: '#94A3B8', fontWeight: 800, textAlign: 'center' }}>Layout Mapping</TableCell>
                          <TableCell style={{ color: '#94A3B8', fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {screens.map((s) => (
                          <TableRow key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <TableCell style={{ fontWeight: 800 }}>{s.name}</TableCell>
                            <TableCell>{s.total_seats} Seats</TableCell>
                            <TableCell style={{ textAlign: 'center' }}>
                              <Button 
                                startIcon={<Layers size={14} />} 
                                size="small"
                                onClick={() => handleOpenLayoutModal(s)}
                                style={{ background: 'rgba(250,204,21,0.12)', color: '#FACC15', textTransform: 'none', fontWeight: 700 }}
                              >
                                Visual Editor
                              </Button>
                            </TableCell>
                            <TableCell style={{ textAlign: 'right' }}>
                              <IconButton onClick={() => handleOpenScreenModal('edit', s)} style={{ color: '#FACC15', padding: '6px' }}>
                                <Edit2 size={16} />
                              </IconButton>
                              <IconButton onClick={() => handleDeleteScreen(s.id)} style={{ color: '#EF4444', padding: '6px' }}>
                                <Trash2 size={16} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>

              {/* Layout Helper Info panel */}
              <Grid item xs={12} md={5}>
                <Paper className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <Typography variant="subtitle1" fontWeight={900} display="flex" alignItems="center" gap="8px" color="primary">
                    <Layers size={18} />
                    Seat Layout System
                  </Typography>
                  <Typography variant="body2" color="textSecondary" style={{ lineHeight: '1.6' }}>
                    Each screen has a configurable seat layout mapping grid rows (A through J) to ticketing pricing categories:
                  </Typography>

                  <Box display="flex" flexDirection="column" gap="12px">
                    <Box display="flex" alignItems="center" gap="14px" p={1.5} style={{ background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', borderLeft: '4px solid #10B981' }}>
                      <Box style={{ background: '#10B981', color: '#FFF', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>SILVER</Box>
                      <Typography variant="body2">Base Price (Default: ₹150)</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap="14px" p={1.5} style={{ background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', borderLeft: '4px solid #F59E0B' }}>
                      <Box style={{ background: '#F59E0B', color: '#FFF', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>GOLD</Box>
                      <Typography variant="body2">Middle Rows (Default: ₹250)</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap="14px" p={1.5} style={{ background: 'rgba(236, 72, 153, 0.1)', borderRadius: '8px', borderLeft: '4px solid #EC4899' }}>
                      <Box style={{ background: '#EC4899', color: '#FFF', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>PLATINUM</Box>
                      <Typography variant="body2">Premium Recliners (Default: ₹350)</Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="caption" color="textSecondary">
                    * Modifying layouts will only apply to new shows scheduled. Existing shows already running will preserve their generated layout seats.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* TAB 3: SHOW MANAGEMENT */}
          {activeTab === 3 && (
            <Box p={1} className="glass-panel" style={{ padding: '24px' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={800}>Show Schedules</Typography>
                <Button 
                  startIcon={<Plus size={16} />} 
                  variant="contained" 
                  className="bg-gradient-primary"
                  onClick={handleOpenShowModal}
                  style={{ color: '#0B0F19', fontWeight: 800, textTransform: 'none', borderRadius: '8px' }}
                >
                  Schedule Show
                </Button>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow style={{ borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
                      <TableCell style={{ color: '#94A3B8', fontWeight: 800 }}>Movie Title</TableCell>
                      <TableCell style={{ color: '#94A3B8', fontWeight: 800 }}>Screen Allocation</TableCell>
                      <TableCell style={{ color: '#94A3B8', fontWeight: 800 }}>Date</TableCell>
                      <TableCell style={{ color: '#94A3B8', fontWeight: 800 }}>Start Time</TableCell>
                      <TableCell style={{ color: '#94A3B8', fontWeight: 800 }}>End Time</TableCell>
                      <TableCell style={{ color: '#94A3B8', fontWeight: 800 }}>Base Ticket Price</TableCell>
                      <TableCell style={{ color: '#94A3B8', fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {shows.map((s) => (
                      <TableRow key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <TableCell style={{ fontWeight: 800 }}>
                          {s.movie_detail?.title || s.event_title || s.sports_title}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={s.screen_detail?.name || 'Main Hall'} 
                            size="small" 
                            style={{ background: 'rgba(255,255,255,0.06)', color: '#FFF' }} 
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(s.start_time).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </TableCell>
                        <TableCell>{new Date(s.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                        <TableCell>{new Date(s.end_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                        <TableCell style={{ color: '#EC4899', fontWeight: 700 }}>₹{s.price}</TableCell>
                        <TableCell style={{ textAlign: 'right' }}>
                          <IconButton onClick={() => handleDeleteShow(s.id)} style={{ color: '#EF4444', padding: '6px' }}>
                            <Trash2 size={16} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* TAB 4: BOOKINGS & SCANS */}
          {activeTab === 4 && (
            <Grid container spacing={4}>
              {/* Left Column: QR check-in scanner & booking search */}
              <Grid item xs={12} md={6}>
                <Paper className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <Typography variant="h6" fontWeight={800} display="flex" alignItems="center" gap="10px">
                    <Scan size={20} color="#FACC15" />
                    Digital Ticket check-in
                  </Typography>

                  {/* Mock QR Camera Shimmer Frame */}
                  <Box 
                    style={{ 
                      width: '100%', 
                      height: '220px', 
                      background: 'rgba(0,0,0,0.3)', 
                      borderRadius: '16px',
                      border: '2px dashed rgba(250, 204, 21, 0.4)',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    {/* Scanner horizontal beam line */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '4px',
                      background: '#FACC15',
                      boxShadow: '0 0 15px #FACC15',
                      animation: 'scan-beam 2.5s infinite linear'
                    }} />
                    
                    <Typography variant="body2" color="textSecondary" style={{ textAlign: 'center', maxWidth: '240px', zIndex: 2 }}>
                      Place QR ticket near counter camera or enter Booking ID below manually.
                    </Typography>

                    <style>{`
                      @keyframes scan-beam {
                        0% { top: 0%; }
                        50% { top: 98%; }
                        100% { top: 0%; }
                      }
                    `}</style>
                  </Box>

                  {/* Manual Code Verify Input */}
                  <Box display="flex" gap="10px">
                    <TextField 
                      fullWidth
                      size="small"
                      label="Enter Ticket / Booking ID"
                      placeholder="e.g. 5A9F1B2C"
                      value={verifyId}
                      onChange={(e) => setVerifyId(e.target.value)}
                      InputProps={{
                        style: { background: 'rgba(22, 31, 48, 0.4)', color: '#FFFFFF', borderRadius: '8px' }
                      }}
                      InputLabelProps={{ style: { color: '#94A3B8' } }}
                    />
                    <Button 
                      variant="contained" 
                      className="bg-gradient-primary"
                      onClick={handleVerifyTicket}
                      disabled={verifying || !verifyId.trim()}
                      style={{ color: '#0B0F19', fontWeight: 800, borderRadius: '8px', textTransform: 'none', px: '24px' }}
                    >
                      {verifying ? <CircularProgress size={20} style={{ color: '#0B0F19' }} /> : 'Verify'}
                    </Button>
                  </Box>

                  {/* Verification Results Output Display */}
                  {verifyResult && (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      {verifyResult.success ? (
                        <Box p={3} style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10B981', borderRadius: '12px', display: 'flex', gap: '14px' }}>
                          <CheckCircle2 size={24} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <Box>
                            <Typography variant="subtitle1" fontWeight={900} style={{ color: '#10B981' }}>ACCESS GRANTED</Typography>
                            <Typography variant="body2" fontWeight={700} mt={1}>{verifyResult.data.movie_title}</Typography>
                            <Typography variant="caption" color="textSecondary" display="block" mt={0.5}>
                              Seats: <strong style={{ color: '#FFF' }}>{verifyResult.data.seats}</strong>
                            </Typography>
                            <Typography variant="caption" color="textSecondary" display="block">
                              Guest: {verifyResult.data.user_name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" display="block">
                              Show Time: {verifyResult.data.show_time}
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        <Box p={3} style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #EF4444', borderRadius: '12px', display: 'flex', gap: '14px' }}>
                          <AlertTriangle size={24} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <Box>
                            <Typography variant="subtitle1" fontWeight={900} style={{ color: '#EF4444' }}>VERIFICATION FAILED</Typography>
                            <Typography variant="body2" mt={0.5} color="textSecondary">{verifyResult.error}</Typography>
                          </Box>
                        </Box>
                      )}
                    </motion.div>
                  )}
                </Paper>

                {/* Show Seats Grid occupancy visualizer */}
                <Paper className="glass-panel" style={{ padding: '30px', marginTop: '24px' }}>
                  <Typography variant="subtitle1" fontWeight={900} mb={3}>
                    Seat Occupancy Monitor
                  </Typography>

                  <FormControl fullWidth size="small" style={{ marginBottom: '20px' }}>
                    <InputLabel style={{ color: '#94A3B8' }}>Select Scheduled Show</InputLabel>
                    <Select
                      value={occupancyShowId}
                      onChange={(e) => handleLoadOccupancy(e.target.value)}
                      style={{ background: 'rgba(22, 31, 48, 0.4)', color: '#FFF', borderRadius: '8px' }}
                      inputProps={{ style: { color: '#FFF' } }}
                    >
                      <MenuItem value="">Select a show...</MenuItem>
                      {shows.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.movie_detail?.title || s.event_title} - {new Date(s.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} ({s.screen_detail?.name})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {occupancyLoading ? (
                    <Box display="flex" justifyContent="center" p={4}>
                      <CircularProgress size={30} style={{ color: '#EC4899' }} />
                    </Box>
                  ) : occupancySeats.length > 0 ? (
                    <Box display="flex" flexDirection="column" alignItems="center" gap="20px">
                      
                      {/* Screen Indicator */}
                      <div style={{
                        width: '70%', height: '8px', background: 'linear-gradient(90deg, transparent, #38BDF8, transparent)',
                        borderRadius: '4px', textAlign: 'center', boxShadow: '0 4px 10px rgba(56, 189, 248, 0.3)'
                      }} />
                      <Typography variant="caption" color="textSecondary" mb={2}>SCREEN THIS WAY</Typography>

                      {/* Seats Grid */}
                      <Box display="flex" flexDirection="column" gap="6px" width="100%" alignItems="center" style={{ overflowX: 'auto' }}>
                        {rows.map((row) => (
                          <Box key={row} display="flex" gap="6px">
                            {cols.map((col) => {
                              const seat = occupancySeats.find((s) => s.row_label === row && s.column_number === col) || {};
                              const colorClass = getSeatColorClass(seat);
                              return (
                                <div 
                                  key={col}
                                  className={colorClass}
                                  style={{
                                    width: '24px', height: '24px', borderRadius: '6px', fontSize: '9px',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 800
                                  }}
                                >
                                  {row}{col}
                                </div>
                              );
                            })}
                          </Box>
                        ))}
                      </Box>

                      {/* Legend */}
                      <Box display="flex" gap="16px" mt={2} justifyContent="center" flexWrap="wrap">
                        <Box display="flex" alignItems="center" gap="6px">
                          <div className="seat-available" style={{ width: '14px', height: '14px', borderRadius: '3px' }} />
                          <Typography variant="caption">Available</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap="6px">
                          <div className="seat-reserved" style={{ width: '14px', height: '14px', borderRadius: '3px' }} />
                          <Typography variant="caption">Reserved</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap="6px">
                          <div className="seat-booked" style={{ width: '14px', height: '14px', borderRadius: '3px' }} />
                          <Typography variant="caption">Booked</Typography>
                        </Box>
                      </Box>
                    </Box>
                  ) : (
                    occupancyShowId && <Typography variant="body2" color="textSecondary" style={{ textAlign: 'center' }}>No seats layout found for this show.</Typography>
                  )}
                </Paper>
              </Grid>

              {/* Right Column: Bookings inventory log */}
              <Grid item xs={12} md={6}>
                <Paper className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="10px">
                    <Typography variant="h6" fontWeight={800}>Bookings Log</Typography>
                    
                    {/* Search Field */}
                    <TextField 
                      size="small"
                      placeholder="Search Booking ID..."
                      value={bookingSearch}
                      onChange={(e) => setBookingSearch(e.target.value)}
                      InputProps={{
                        startAdornment: <Search size={14} color="#94A3B8" style={{ marginRight: '6px' }} />,
                        style: { background: 'rgba(22, 31, 48, 0.4)', color: '#FFF', borderRadius: '8px', fontSize: '13px' }
                      }}
                    />
                  </Box>

                  <TableContainer style={{ maxHeight: '580px', overflowY: 'auto' }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell style={{ background: '#161F30', color: '#94A3B8', fontWeight: 800 }}>Booking ID</TableCell>
                          <TableCell style={{ background: '#161F30', color: '#94A3B8', fontWeight: 800 }}>Show Details</TableCell>
                          <TableCell style={{ background: '#161F30', color: '#94A3B8', fontWeight: 800 }}>Seats</TableCell>
                          <TableCell style={{ background: '#161F30', color: '#94A3B8', fontWeight: 800 }}>Amount</TableCell>
                          <TableCell style={{ background: '#161F30', color: '#94A3B8', fontWeight: 800 }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredBookings.map((b) => (
                          <TableRow key={b.id} hover style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }} onClick={() => setVerifyId(b.booking_id)}>
                            <TableCell style={{ fontFamily: 'monospace', fontWeight: 800, color: '#38BDF8' }}>
                              {b.booking_id}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={700}>{b.show_detail?.movie_detail?.title || 'Event/Sport'}</Typography>
                              <Typography variant="caption" color="textSecondary" display="block">
                                {new Date(b.show_detail?.start_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at {new Date(b.show_detail?.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                            </TableCell>
                            <TableCell style={{ fontWeight: 700, color: '#10B981' }}>{b.seats_display}</TableCell>
                            <TableCell style={{ fontWeight: 700 }}>₹{b.total_price}</TableCell>
                            <TableCell>
                              {b.is_used ? (
                                <Chip label="Used" size="small" style={{ background: 'rgba(255,255,255,0.08)', color: '#94A3B8', fontWeight: 700 }} />
                              ) : (
                                <Chip 
                                  label={b.status} 
                                  size="small" 
                                  style={{ 
                                    background: b.status === 'Confirmed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                                    color: b.status === 'Confirmed' ? '#10B981' : '#EF4444',
                                    fontWeight: 700
                                  }} 
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* TAB 5: MANAGE THEATRES */}
          {activeTab === 5 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight={800}>Theatres Directory</Typography>
                <Button 
                  variant="contained" 
                  className="bg-gradient-primary glow-pink" 
                  onClick={() => handleOpenTheatreModal('add')}
                  style={{ color: '#0B0F19', fontWeight: 800 }}
                >
                  Add Theatre
                </Button>
              </Box>
              
              <TableContainer component={Paper} className="glass-panel" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell style={{ fontWeight: 800, color: '#94A3B8' }}>Theatre ID</TableCell>
                      <TableCell style={{ fontWeight: 800, color: '#94A3B8' }}>Name</TableCell>
                      <TableCell style={{ fontWeight: 800, color: '#94A3B8' }}>Brand</TableCell>
                      <TableCell style={{ fontWeight: 800, color: '#94A3B8' }}>City</TableCell>
                      <TableCell style={{ fontWeight: 800, color: '#94A3B8' }}>Address</TableCell>
                      <TableCell style={{ fontWeight: 800, color: '#94A3B8' }}>Contact Info</TableCell>
                      <TableCell style={{ fontWeight: 800, color: '#94A3B8' }}>Facilities</TableCell>
                      <TableCell style={{ fontWeight: 800, color: '#94A3B8' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {theatres.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" style={{ color: '#94A3B8', padding: '40px' }}>
                          No theatres registered yet. Click "Add Theatre" to create one.
                        </TableCell>
                      </TableRow>
                    ) : (
                      theatres.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell style={{ fontFamily: 'monospace' }}>#{t.id}</TableCell>
                          <TableCell style={{ fontWeight: 700, color: '#FFF' }}>{t.name}</TableCell>
                          <TableCell>{t.brand || '-'}</TableCell>
                          <TableCell>{t.city || '-'}</TableCell>
                          <TableCell style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.address || '-'}
                          </TableCell>
                          <TableCell>{t.contact_details || '-'}</TableCell>
                          <TableCell>{t.facilities || '-'}</TableCell>
                          <TableCell>
                            <Box display="flex" gap="8px">
                              <Button 
                                size="small" 
                                variant="outlined" 
                                style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#FFF' }}
                                onClick={() => handleOpenTheatreModal('edit', t)}
                              >
                                Edit
                              </Button>
                              <Button 
                                size="small" 
                                variant="outlined" 
                                color="error" 
                                onClick={() => handleDeleteTheatre(t.id)}
                              >
                                Delete
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

        </motion.div>
      </AnimatePresence>

      {/* --- MOVIE CRUD MODAL --- */}
      <Dialog open={movieModal.open} onClose={() => setMovieModal({ open: false, mode: 'add', data: null })} PaperProps={{ style: { background: '#161F30', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' } }}>
        <DialogTitle style={{ fontWeight: 800 }}>{movieModal.mode === 'edit' ? 'Edit Movie Details' : 'Add New Movie to Catalogue'}</DialogTitle>
        <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '10px' }}>
          <TextField 
            fullWidth label="Movie Title" value={movieForm.title} onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
            InputProps={{ style: { color: '#FFF' } }} InputLabelProps={{ style: { color: '#94A3B8' } }}
          />
          <TextField 
            fullWidth label="Poster Image URL" value={movieForm.poster} onChange={(e) => setMovieForm({ ...movieForm, poster: e.target.value })}
            InputProps={{ style: { color: '#FFF' } }} InputLabelProps={{ style: { color: '#94A3B8' } }}
          />
          <TextField 
            fullWidth label="Trailer URL (YouTube Embed Link)" value={movieForm.trailer} onChange={(e) => setMovieForm({ ...movieForm, trailer: e.target.value })}
            InputProps={{ style: { color: '#FFF' } }} InputLabelProps={{ style: { color: '#94A3B8' } }}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField 
                fullWidth label="Language" value={movieForm.language} onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                InputProps={{ style: { color: '#FFF' } }} InputLabelProps={{ style: { color: '#94A3B8' } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField 
                fullWidth label="Duration (mins)" type="number" value={movieForm.duration} onChange={(e) => setMovieForm({ ...movieForm, duration: e.target.value })}
                InputProps={{ style: { color: '#FFF' } }} InputLabelProps={{ style: { color: '#94A3B8' } }}
              />
            </Grid>
          </Grid>
          <TextField 
            fullWidth label="Genre (Comma separated)" value={movieForm.genre} onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })}
            InputProps={{ style: { color: '#FFF' } }} InputLabelProps={{ style: { color: '#94A3B8' } }}
          />
          <TextField 
            fullWidth label="Synopsis / Description" multiline rows={3} value={movieForm.synopsis} onChange={(e) => setMovieForm({ ...movieForm, synopsis: e.target.value })}
            InputProps={{ style: { color: '#FFF' } }} InputLabelProps={{ style: { color: '#94A3B8' } }}
          />
          <FormControl fullWidth>
            <InputLabel style={{ color: '#94A3B8' }}>Release Status</InputLabel>
            <Select 
              value={movieForm.status} onChange={(e) => setMovieForm({ ...movieForm, status: e.target.value })}
              style={{ color: '#FFF' }}
            >
              <MenuItem value="Now Showing">Now Showing</MenuItem>
              <MenuItem value="Coming Soon">Coming Soon</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions style={{ padding: '16px 24px' }}>
          <Button onClick={() => setMovieModal({ open: false, mode: 'add', data: null })} style={{ color: '#94A3B8', textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" className="bg-gradient-primary" onClick={handleSaveMovie} style={{ color: '#0B0F19', fontWeight: 800, textTransform: 'none', borderRadius: '8px' }}>Save Movie</Button>
        </DialogActions>
      </Dialog>

      {/* --- SCREEN CRUD MODAL --- */}
      <Dialog open={screenModal.open} onClose={() => setScreenModal({ open: false, mode: 'add', data: null })} PaperProps={{ style: { background: '#161F30', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' } }}>
        <DialogTitle style={{ fontWeight: 800 }}>{screenModal.mode === 'edit' ? 'Edit Screen capacity' : 'Add New Screen'}</DialogTitle>
        <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '10px' }}>
          <TextField 
            fullWidth label="Screen Name" placeholder="e.g. Audi 1" value={screenForm.name} onChange={(e) => setScreenForm({ ...screenForm, name: e.target.value })}
            InputProps={{ style: { color: '#FFF' } }} InputLabelProps={{ style: { color: '#94A3B8' } }}
          />
          <TextField 
            fullWidth label="Seat Capacity" type="number" value={screenForm.total_seats} onChange={(e) => setScreenForm({ ...screenForm, total_seats: e.target.value })}
            InputProps={{ style: { color: '#FFF' } }} InputLabelProps={{ style: { color: '#94A3B8' } }}
          />
        </DialogContent>
        <DialogActions style={{ padding: '16px 24px' }}>
          <Button onClick={() => setScreenModal({ open: false, mode: 'add', data: null })} style={{ color: '#94A3B8', textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" className="bg-gradient-primary" onClick={handleSaveScreen} style={{ color: '#0B0F19', fontWeight: 800, textTransform: 'none', borderRadius: '8px' }}>Save Screen</Button>
        </DialogActions>
      </Dialog>

      {/* --- SHOW CRUD MODAL --- */}
      <Dialog open={showModal.open} onClose={() => setShowModal({ open: false, mode: 'add', data: null })} PaperProps={{ style: { background: '#161F30', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' } }}>
        <DialogTitle style={{ fontWeight: 800 }}>Schedule Movie Show</DialogTitle>
        <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '10px' }}>
          <FormControl fullWidth>
            <InputLabel style={{ color: '#94A3B8' }}>Select Movie</InputLabel>
            <Select 
              value={showForm.movie} onChange={(e) => setShowForm({ ...showForm, movie: e.target.value })}
              style={{ color: '#FFF' }}
            >
              {movies.map((m) => <MenuItem key={m.id} value={m.id}>{m.title}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel style={{ color: '#94A3B8' }}>Select Screen</InputLabel>
            <Select 
              value={showForm.screen} onChange={(e) => setShowForm({ ...showForm, screen: e.target.value })}
              style={{ color: '#FFF' }}
            >
              {screens.map((s) => <MenuItem key={s.id} value={s.id}>{s.name} ({s.total_seats} seats)</MenuItem>)}
            </Select>
          </FormControl>
          <TextField 
            fullWidth label="Date & Start Time" type="datetime-local" value={showForm.start_time} onChange={(e) => setShowForm({ ...showForm, start_time: e.target.value })}
            InputProps={{ style: { color: '#FFF' } }} InputLabelProps={{ shrink: true, style: { color: '#94A3B8' } }}
          />
          <TextField 
            fullWidth label="Base Ticket Price (₹)" type="number" value={showForm.price} onChange={(e) => setShowForm({ ...showForm, price: e.target.value })}
            InputProps={{ style: { color: '#FFF' } }} InputLabelProps={{ style: { color: '#94A3B8' } }}
          />
        </DialogContent>
        <DialogActions style={{ padding: '16px 24px' }}>
          <Button onClick={() => setShowModal({ open: false, mode: 'add', data: null })} style={{ color: '#94A3B8', textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" className="bg-gradient-primary" onClick={handleSaveShow} style={{ color: '#0B0F19', fontWeight: 800, textTransform: 'none', borderRadius: '8px' }}>Save Schedule</Button>
        </DialogActions>
      </Dialog>

      {/* --- VISUAL SEAT LAYOUT MODAL --- */}
      <Dialog open={layoutModal.open} onClose={() => setLayoutModal({ open: false, screen: null, layout: {} })} PaperProps={{ style: { background: '#161F30', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', width: '600px', maxWidth: '90%' } }}>
        <DialogTitle style={{ fontWeight: 800 }}>Configure Layout - {layoutModal.screen?.name}</DialogTitle>
        <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '10px' }}>
          <Typography variant="body2" color="textSecondary">
            Set row categories mapping (each row will contain 10 seats).
          </Typography>

          <Box display="flex" flexDirection="column" gap="12px" style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {rows.map((row) => {
              const currentCat = layoutModal.layout[row] || 'Silver';
              return (
                <Box key={row} display="flex" justifyContent="space-between" alignItems="center" p={1.5} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <Typography variant="subtitle2" fontWeight={800}>Row {row}</Typography>
                  <Select
                    value={currentCat}
                    onChange={(e) => handleRowCategoryChange(row, e.target.value)}
                    size="small"
                    style={{ color: '#FFF', background: 'rgba(11, 15, 25, 0.4)', borderRadius: '6px', width: '150px' }}
                  >
                    <MenuItem value="Silver">Silver (₹150)</MenuItem>
                    <MenuItem value="Gold">Gold (₹250)</MenuItem>
                    <MenuItem value="Platinum">Platinum (₹350)</MenuItem>
                  </Select>
                </Box>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions style={{ padding: '16px 24px' }}>
          <Button onClick={() => setLayoutModal({ open: false, screen: null, layout: {} })} style={{ color: '#94A3B8', textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" className="bg-gradient-primary" onClick={handleSaveLayout} style={{ color: '#0B0F19', fontWeight: 800, textTransform: 'none', borderRadius: '8px' }}>Save Layout</Button>
        </DialogActions>
      </Dialog>

      {/* --- THEATRE CRUD DIALOG --- */}
      <Dialog 
        open={theatreModal.open} 
        onClose={() => setTheatreModal({ open: false, mode: 'add', data: null })} 
        PaperProps={{ style: { background: '#161F30', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', width: '500px', maxWidth: '95%' } }}
      >
        <DialogTitle style={{ fontWeight: 800 }}>
          {theatreModal.mode === 'edit' ? 'Edit Theatre Details' : 'Add New Theatre'}
        </DialogTitle>
        <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '10px' }}>
          <TextField 
            fullWidth label="Theatre Name" value={theatreForm.name} onChange={(e) => setTheatreForm({ ...theatreForm, name: e.target.value })}
            InputProps={{ style: { color: '#FFF' } }} InputLabelProps={{ style: { color: '#94A3B8' } }}
          />
          <TextField 
            fullWidth label="Brand (e.g. PVR, INOX)" value={theatreForm.brand} onChange={(e) => setTheatreForm({ ...theatreForm, brand: e.target.value })}
            InputProps={{ style: { color: '#FFF' } }} InputLabelProps={{ style: { color: '#94A3B8' } }}
          />
          <FormControl fullWidth>
            <InputLabel style={{ color: '#94A3B8' }}>City Location</InputLabel>
            <Select
              value={theatreForm.location}
              onChange={(e) => setTheatreForm({ ...theatreForm, location: e.target.value })}
              label="City Location"
              style={{ color: '#FFF' }}
            >
              {locations.map((loc) => (
                <MenuItem key={loc.id} value={loc.id} style={{ background: '#161F30', color: '#FFF' }}>
                  {loc.city}, {loc.state}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField 
            fullWidth multiline rows={3} label="Address" value={theatreForm.address} onChange={(e) => setTheatreForm({ ...theatreForm, address: e.target.value })}
            InputProps={{ style: { color: '#FFF' } }} InputLabelProps={{ style: { color: '#94A3B8' } }}
          />
          <TextField 
            fullWidth label="Contact Details" value={theatreForm.contact_details} onChange={(e) => setTheatreForm({ ...theatreForm, contact_details: e.target.value })}
            InputProps={{ style: { color: '#FFF' } }} InputLabelProps={{ style: { color: '#94A3B8' } }}
          />
          <TextField 
            fullWidth label="Facilities (comma-separated, e.g. Dolby Atmos, IMAX)" value={theatreForm.facilities} onChange={(e) => setTheatreForm({ ...theatreForm, facilities: e.target.value })}
            InputProps={{ style: { color: '#FFF' } }} InputLabelProps={{ style: { color: '#94A3B8' } }}
          />
          <TextField 
            fullWidth label="Coordinates (Latitude, Longitude)" value={theatreForm.coordinates} onChange={(e) => setTheatreForm({ ...theatreForm, coordinates: e.target.value })}
            InputProps={{ style: { color: '#FFF' } }} InputLabelProps={{ style: { color: '#94A3B8' } }}
          />
        </DialogContent>
        <DialogActions style={{ padding: '16px 24px' }}>
          <Button onClick={() => setTheatreModal({ open: false, mode: 'add', data: null })} style={{ color: '#94A3B8', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            className="bg-gradient-primary" 
            onClick={handleSaveTheatre} 
            disabled={!theatreForm.name.trim() || !theatreForm.location}
            style={{ color: '#0B0F19', fontWeight: 800, textTransform: 'none', borderRadius: '8px' }}
          >
            Save Theatre
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast notifications */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setToast({ ...toast, open: false })} severity={toast.severity} style={{ borderRadius: '8px', fontWeight: 700 }}>
          {toast.message}
        </Alert>
      </Snackbar>

    </Container>
  );
};

export default ManagerDashboard;
