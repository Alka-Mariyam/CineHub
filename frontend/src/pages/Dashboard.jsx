import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter, Calendar, Heart, Award, Star, AlertCircle, Languages, Tag,
  IndianRupee, Smile, Zap, Skull, ChevronLeft, ChevronRight, Film, Play, Music, Trophy
} from 'lucide-react';
import {
  Container, Grid, Box, Typography, Button, MenuItem, Select, InputLabel,
  FormControl, Slider, Paper, useMediaQuery, IconButton, CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import GlassmorphicCard from '../components/GlassmorphicCard';
import { API } from '../store';

const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { selectedCity } = useSelector((state) => state.location);
  const { query, category } = useSelector((state) => state.search);

  // States for list data
  const [movies, setMovies] = useState([]);
  const [events, setEvents] = useState([]);
  const [sports, setSports] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);

  // States for filters
  const [mood, setMood] = useState('');
  const [language, setLanguage] = useState('');
  const [genre, setGenre] = useState('');
  const [budget, setBudget] = useState(300);
  const [tempBudget, setTempBudget] = useState(300);
  const [showDates, setShowDates] = useState('');

  // Hero banner state
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    // Generate date parameters based on showDates
    let dateParams = '';
    if (showDates === 'today') {
      const today = new Date().toISOString().split('T')[0];
      dateParams = `&date=${today}`;
    } else if (showDates === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      dateParams = `&date=${tomorrowStr}`;
    } else if (showDates === 'weekend') {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 is Sunday, 6 is Saturday
      
      const sat = new Date(today);
      sat.setDate(today.getDate() + (6 - dayOfWeek));
      const sun = new Date(today);
      sun.setDate(today.getDate() + (7 - dayOfWeek));
      
      const satStr = sat.toISOString().split('T')[0];
      const sunStr = sun.toISOString().split('T')[0];
      dateParams = `&start_date=${satStr}&end_date=${sunStr}`;
    }

    // Fetch Movies (Only recommended by default when no filters are active to speed up page load)
    let movieUrl = `/movies/?city=${selectedCity}`;
    const hasActiveFilters = mood || language || genre || query || (budget !== 300) || showDates;
    if (!hasActiveFilters) {
      movieUrl += '&is_recommended=True';
    }
    if (mood) movieUrl += `&mood=${mood}`;
    if (language) movieUrl += `&language=${language}`;
    if (genre) movieUrl += `&genre=${genre}`;
    if (query) movieUrl += `&search=${query}`;
    movieUrl += `&max_price=${budget}`;
    if (dateParams) movieUrl += dateParams;
    
    API.get(movieUrl)
      .then((res) => {
        setMovies(res.data.results || res.data);
      })
      .catch(() => {});

    // Fetch Events
    let eventUrl = `/events/?city=${selectedCity}`;
    if (query) eventUrl += `&search=${query}`;
    eventUrl += `&max_price=${budget}`;
    if (dateParams) eventUrl += dateParams;
    
    API.get(eventUrl)
      .then((res) => {
        setEvents(res.data.results || res.data);
      })
      .catch(() => {});

    // Fetch Sports
    let sportsUrl = `/sports/?city=${selectedCity}`;
    if (query) sportsUrl += `&search=${query}`;
    sportsUrl += `&max_price=${budget}`;
    if (dateParams) sportsUrl += dateParams;

    API.get(sportsUrl)
      .then((res) => {
        setSports(res.data.results || res.data);
      })
      .catch(() => {});

    // Fetch Theatres in the selected city
    API.get(`/theatres/?city=${selectedCity}`)
      .then((res) => {
        setTheatres(res.data.results || res.data);
      })
      .catch(() => {});
  }, [selectedCity, query, mood, language, genre, budget, showDates]);

  useEffect(() => {
    // Load trending movies for hero banner
    API.get('/movies/?is_trending=True')
      .then((res) => {
        const list = res.data.results || res.data;
        if (list.length > 0) setTrendingMovies(list);
      })
      .catch(() => {});
  }, []);

  // Autoplay hero carousel
  useEffect(() => {
    if (trendingMovies.length === 0) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % trendingMovies.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [trendingMovies]);

  const activeHero = trendingMovies[heroIndex] || {
    id: 1,
    title: "Coldplay Music Festival",
    synopsis: "Experience Coldplay live in BKC grounds performing their greatest hits. An absolute visual wonder.",
    poster: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200",
    is_trending: true,
  };

  const handleMoodSelect = (selectedMood) => {
    setMood(mood === selectedMood ? '' : selectedMood);
  };

  const nextSlide = () => {
    setHeroIndex((prev) => (prev + 1) % trendingMovies.length);
  };

  const prevSlide = () => {
    setHeroIndex((prev) => (prev - 1 + trendingMovies.length) % trendingMovies.length);
  };

  return (
    <Box pb={8}>
      {/* 1. Hero Autoplay Banner */}
      <Box position="relative" height={isMobile ? '400px' : '520px'} width="100%" overflow="hidden" style={{ background: '#070a13' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={heroIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0 }}
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: `url(${activeHero.poster})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'absolute',
              filter: 'brightness(0.35) blur(4px)'
            }}
          />
        </AnimatePresence>

        {/* Carousel overlay gradient */}
        <div className="carousel-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }} />

        {/* Banner Details */}
        <Container maxWidth="lg" style={{ height: '100%', display: 'flex', alignItems: 'center', position: 'relative', zIndex: 2 }}>
          <Grid container spacing={4} alignItems="center" style={{ height: '100%' }}>
            {/* Details Column */}
            <Grid item xs={12} md={7} display="flex" flexDirection="column" justifyContent="center">
              <motion.div
                key={`text-${heroIndex}`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                {activeHero.is_trending && (
                  <Box display="inline-flex" alignItems="center" gap="6px" p="4px 14px" borderRadius="30px" background="rgba(236, 72, 153, 0.2)" border="1px solid #EC4899" mb={2}>
                    <Award size={14} color="#EC4899" />
                    <Typography variant="caption" fontWeight={800} style={{ color: '#EC4899', letterSpacing: '1px' }}>TRENDING ON CINEHUB</Typography>
                  </Box>
                )}

                <Typography variant={isMobile ? 'h3' : 'h2'} gutterBottom fontWeight={900} style={{ textShadow: '0 4px 16px rgba(0,0,0,0.7)', lineHeight: 1.1 }}>
                  {activeHero.title}
                </Typography>

                <Typography variant="body1" color="#CBD5E1" paragraph mb={4} style={{ fontSize: isMobile ? '13px' : '15px', lineHeight: '1.6', textShadow: '0 2px 8px rgba(0,0,0,0.6)', maxWidth: '550px' }}>
                  {activeHero.synopsis}
                </Typography>

                <Box display="flex" gap="14px" flexWrap="wrap">
                  <Button
                    variant="contained"
                    className="bg-gradient-primary glow-pink"
                    onClick={() => {
                      if (activeHero.id) {
                        navigate(`/movie/${activeHero.id}`);
                      }
                    }}
                    style={{ borderRadius: '10px', padding: '12px 32px', fontWeight: 800, color: '#0B0F19' }}
                  >
                    Book Tickets
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      if (activeHero.id) {
                        navigate(`/movie/${activeHero.id}`);
                      }
                    }}
                    style={{ borderColor: '#FACC15', color: '#FACC15', borderRadius: '10px', padding: '12px 28px', fontWeight: 700 }}
                  >
                    View Details
                  </Button>
                </Box>
              </motion.div>
            </Grid>

            {/* Poster image preview (Desktop only) */}
            {!isMobile && (
              <Grid item md={5} display="flex" justifyContent="center">
                <motion.div
                  key={`poster-${heroIndex}`}
                  initial={{ scale: 0.9, opacity: 0, rotate: 1 }}
                  animate={{ scale: 1, opacity: 1, rotate: -1 }}
                  transition={{ duration: 0.8 }}
                  style={{ width: '260px', height: '370px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <img src={activeHero.poster} alt={activeHero.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </motion.div>
              </Grid>
            )}
          </Grid>
        </Container>

        {/* Carousel Navigation Arrows */}
        {trendingMovies.length > 1 && !isMobile && (
          <>
            <IconButton
              onClick={prevSlide}
              style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(22, 31, 48, 0.6)', border: '1px solid rgba(255,255,255,0.08)', color: '#FFF', zIndex: 10 }}
            >
              <ChevronLeft size={20} />
            </IconButton>
            <IconButton
              onClick={nextSlide}
              style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(22, 31, 48, 0.6)', border: '1px solid rgba(255,255,255,0.08)', color: '#FFF', zIndex: 10 }}
            >
              <ChevronRight size={20} />
            </IconButton>
          </>
        )}

        {/* Slide Indicators */}
        {trendingMovies.length > 1 && (
          <Box position="absolute" bottom="20px" left="50%" style={{ transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 10 }}>
            {trendingMovies.map((_, idx) => (
              <div
                key={idx}
                onClick={() => setHeroIndex(idx)}
                style={{
                  width: heroIndex === idx ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: heroIndex === idx ? '#FACC15' : 'rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* 2. Interactive Mood recommendations (Only for Movies) */}
      {category === 'Movies' && (
        <Container maxWidth="lg" style={{ marginTop: '48px' }}>
          <Typography variant="h5" fontWeight={800} mb={3} display="flex" alignItems="center" gap="8px">
            <span>🎭</span> How is your mood today?
          </Typography>
          <Grid container spacing={2}>
            {[
              { label: 'Happy', emoji: '😊', icon: <Smile size={18} />, color: '#10B981', glow: 'rgba(16, 185, 129, 0.3)' },
              { label: 'Excited', emoji: '🤩', icon: <Zap size={18} />, color: '#EC4899', glow: 'rgba(236, 72, 153, 0.3)' },
              { label: 'Romantic', emoji: '💖', icon: <Heart size={18} />, color: '#FACC15', glow: 'rgba(250, 204, 21, 0.3)' },
              { label: 'Scared', emoji: '😱', icon: <Skull size={18} />, color: '#EF4444', glow: 'rgba(239, 68, 68, 0.3)' }
            ].map((m) => (
              <Grid item xs={6} sm={3} key={m.label}>
                <Paper
                  onClick={() => handleMoodSelect(m.label)}
                  style={{
                    background: mood === m.label ? m.color : 'rgba(22, 31, 48, 0.55)',
                    border: `1px solid ${mood === m.label ? m.color : 'rgba(255, 255, 255, 0.08)'}`,
                    color: mood === m.label ? '#0B0F19' : '#FFFFFF',
                    borderRadius: '16px',
                    padding: '16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    boxShadow: mood === m.label ? `0 8px 24px ${m.glow}` : 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  component={motion.div}
                  whileHover={{ y: -4, borderColor: m.color }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Box display="flex" flexDirection="column" alignItems="center" gap="8px">
                    <span style={{ fontSize: '26px' }}>{m.emoji}</span>
                    <Typography variant="subtitle2" fontWeight={800} display="flex" alignItems="center" gap="4px">
                      {m.icon} {m.label}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      )}

      {/* 3. Filters Panel & Main Grid */}
      <Container maxWidth="lg" style={{ marginTop: '48px' }}>
        <Grid container spacing={4}>
          
          {/* Filters Column */}
          <Grid item xs={12} md={3}>
            <Box p={3} className="glass-panel" display="flex" flexDirection="column" gap="24px">
              <Box display="flex" alignItems="center" gap="8px" borderBottom="1px solid rgba(255,255,255,0.08)" pb={1}>
                <Filter size={18} color="#EC4899" />
                <Typography variant="h6" fontWeight={800}>Filter Catalog</Typography>
              </Box>

              {/* Language (Movies only) */}
              {category === 'Movies' && (
                <Box>
                  <Typography variant="body2" color="textSecondary" mb={1} display="flex" alignItems="center" gap="6px" fontWeight={600}>
                    <Languages size={14} color="#FACC15" /> Language
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      displayEmpty
                      style={{ background: 'rgba(11,15,25,0.5)', color: '#FFF', borderRadius: '8px' }}
                    >
                      <MenuItem value="">All Languages</MenuItem>
                      <MenuItem value="English">English</MenuItem>
                      <MenuItem value="Hindi">Hindi</MenuItem>
                      <MenuItem value="Malayalam">Malayalam</MenuItem>
                      <MenuItem value="Tamil">Tamil</MenuItem>
                      <MenuItem value="Telugu">Telugu</MenuItem>
                      <MenuItem value="Kannada">Kannada</MenuItem>
                      <MenuItem value="Japanese">Japanese</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}

              {/* Genre (Movies only) */}
              {category === 'Movies' && (
                <Box>
                  <Typography variant="body2" color="textSecondary" mb={1} display="flex" alignItems="center" gap="6px" fontWeight={600}>
                    <Tag size={14} color="#FACC15" /> Genre
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      displayEmpty
                      style={{ background: 'rgba(11,15,25,0.5)', color: '#FFF', borderRadius: '8px' }}
                    >
                      <MenuItem value="">All Genres</MenuItem>
                      <MenuItem value="Action">Action</MenuItem>
                      <MenuItem value="Comedy">Comedy</MenuItem>
                      <MenuItem value="Drama">Drama</MenuItem>
                      <MenuItem value="Horror">Horror</MenuItem>
                      <MenuItem value="Romance">Romance</MenuItem>
                      <MenuItem value="Sci-Fi">Sci-Fi</MenuItem>
                      <MenuItem value="Thriller">Thriller</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}

              <Box>
                <Typography variant="body2" color="textSecondary" mb={1.5} display="flex" alignItems="center" gap="6px" fontWeight={600}>
                  <IndianRupee size={14} color="#FACC15" /> Max Ticket Price: ₹{tempBudget}
                </Typography>
                <Slider
                  value={tempBudget}
                  onChange={(e, val) => setTempBudget(val)}
                  onChangeCommitted={(e, val) => setBudget(val)}
                  min={120}
                  max={300}
                  step={5}
                  valueLabelDisplay="auto"
                  style={{ color: '#EC4899' }}
                />
                <Box display="flex" justifyContent="space-between" mt={-1}>
                  <Typography variant="caption" color="textSecondary">₹120</Typography>
                  <Typography variant="caption" color="textSecondary">₹300</Typography>
                </Box>
              </Box>

              {/* Date Filters */}
              <Box>
                <Typography variant="body2" color="textSecondary" mb={1} display="flex" alignItems="center" gap="6px" fontWeight={600}>
                  <Calendar size={14} color="#FACC15" /> Date Selection
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={showDates}
                    onChange={(e) => setShowDates(e.target.value)}
                    displayEmpty
                    style={{ background: 'rgba(11,15,25,0.5)', color: '#FFF', borderRadius: '8px' }}
                  >
                    <MenuItem value="">Any Date</MenuItem>
                    <MenuItem value="today">Today</MenuItem>
                    <MenuItem value="tomorrow">Tomorrow</MenuItem>
                    <MenuItem value="weekend">This Weekend</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Clear Filters Button */}
              <Button
                variant="outlined"
                onClick={() => {
                  setMood('');
                  setLanguage('');
                  setGenre('');
                  setBudget(300);
                  setTempBudget(300);
                  setShowDates('');
                }}
                style={{ borderColor: 'rgba(255,255,255,0.15)', color: '#FFFFFF', borderRadius: '8px', fontWeight: 700 }}
              >
                Clear All Filters
              </Button>
            </Box>
          </Grid>

          {/* Cards Grid Column */}
          <Grid item xs={12} md={9}>
            {/* Header Title based on Category */}
            <Box mb={4} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="10px">
              <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={900}>
                Recommended <span className="text-gradient">{category}</span> in {selectedCity}
              </Typography>
              <Typography variant="body2" color="textSecondary" fontWeight={600}>
                {category === 'Movies' ? movies.length : (category === 'Events' ? events.length : sports.length)} matches found
              </Typography>
            </Box>

            {/* Movies list */}
            {category === 'Movies' && (
              movies.length === 0 ? (
                <NoResultsFound />
              ) : (
                <Grid container spacing={3}>
                  {movies.map((movie) => (
                    <Grid item xs={12} sm={6} md={4} key={movie.id}>
                      <GlassmorphicCard onClick={() => navigate(`/movie/${movie.id}`)}>
                        <div style={{ position: 'relative', paddingBottom: '140%', overflow: 'hidden' }}>
                          <img
                            src={movie.poster}
                            alt={movie.title}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                            className="card-img-hover"
                          />
                          {movie.is_premiere && (
                            <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#EC4899', color: '#0B0F19', padding: '3px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 900, boxShadow: '0 4px 12px rgba(236,72,153,0.4)' }}>
                              PREMIERE
                            </div>
                          )}
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(11,15,25,0.95) 0%, rgba(11,15,25,0) 100%)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box display="flex" alignItems="center" gap="4px">
                              <Star size={14} color="#FACC15" fill="#FACC15" />
                              <span style={{ fontSize: '13px', fontWeight: 800, color: '#FACC15' }}>{movie.rating}</span>
                              <span style={{ fontSize: '11px', color: '#94A3B8' }}>({movie.votes})</span>
                            </Box>
                          </div>
                        </div>
                        <Box p={2.5}>
                          <Typography variant="h6" fontWeight={800} noWrap>{movie.title}</Typography>
                          <Typography variant="body2" color="textSecondary" style={{ fontSize: '12px', marginTop: '2px' }} noWrap>{movie.genre}</Typography>
                          
                          <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} mb={2}>
                            <Typography variant="caption" style={{ fontWeight: 800, color: '#EC4899', background: 'rgba(236,72,153,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                              {movie.language}
                            </Typography>
                            <span style={{ fontSize: '15px', fontWeight: 900, color: '#FACC15' }}>₹{movie.price || '150'}</span>
                          </Box>

                          <Box display="flex" gap="10px">
                            <Button size="small" variant="contained" className="bg-gradient-primary glow-pink" fullWidth onClick={(e) => { e.stopPropagation(); navigate(`/movie/${movie.id}`); }} style={{ color: '#0B0F19', fontWeight: 800 }}>
                              Book Now
                            </Button>
                            <Button size="small" variant="outlined" fullWidth onClick={(e) => { e.stopPropagation(); navigate(`/movie/${movie.id}?reserve=true`); }} style={{ borderColor: 'rgba(255,255,255,0.15)', color: '#FFFFFF' }}>
                              Book Later
                            </Button>
                          </Box>
                        </Box>
                      </GlassmorphicCard>
                    </Grid>
                  ))}
                </Grid>
              )
            )}

            {/* Events list */}
            {category === 'Events' && (
              events.length === 0 ? (
                <NoResultsFound />
              ) : (
                <Grid container spacing={3}>
                  {events.map((event) => (
                    <Grid item xs={12} sm={6} md={4} key={event.id}>
                      <GlassmorphicCard onClick={() => navigate(`/event/${event.id}`)}>
                        <div style={{ position: 'relative', paddingBottom: '60%', overflow: 'hidden' }}>
                          <img
                            src={event.banner}
                            alt={event.title}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#EC4899', color: '#0B0F19', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 900, boxShadow: '0 4px 12px rgba(236,72,153,0.3)' }}>
                            {event.category}
                          </div>
                        </div>
                        <Box p={2.5}>
                          <Typography variant="h6" fontWeight={800} style={{ fontSize: '16px' }} noWrap>{event.title}</Typography>
                          <Typography variant="body2" color="textSecondary" style={{ fontSize: '12px', marginTop: '4px' }} noWrap>{event.venue_detail?.name}</Typography>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                            <span style={{ fontSize: '16px', fontWeight: 900, color: '#FACC15' }}>From ₹{event.price}</span>
                            <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>{event.date}</span>
                          </Box>
                        </Box>
                      </GlassmorphicCard>
                    </Grid>
                  ))}
                </Grid>
              )
            )}

            {/* Sports list */}
            {category === 'Sports' && (
              sports.length === 0 ? (
                <NoResultsFound />
              ) : (
                <Grid container spacing={3}>
                  {sports.map((sport) => (
                    <Grid item xs={12} sm={6} md={4} key={sport.id}>
                      <GlassmorphicCard onClick={() => navigate(`/sports/${sport.id}`)}>
                        <div style={{ position: 'relative', paddingBottom: '60%', overflow: 'hidden' }}>
                          <img
                            src={sport.banner}
                            alt={sport.title}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <Box p={2.5}>
                          <Typography variant="h6" fontWeight={800} style={{ fontSize: '16px' }} noWrap>{sport.title}</Typography>
                          <Typography variant="body2" color="textSecondary" style={{ fontSize: '12px', marginTop: '4px' }}>{sport.stadium_name}</Typography>
                          <Typography variant="caption" color="textSecondary" display="block" mt={0.5}>{sport.match_timings}</Typography>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                            <span style={{ fontSize: '16px', fontWeight: 900, color: '#FACC15' }}>Seats ₹{sport.price}</span>
                            <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>{sport.date}</span>
                          </Box>
                        </Box>
                      </GlassmorphicCard>
                    </Grid>
                  ))}
                </Grid>
              )
            )}

            {/* Stream List (Online Premiere Movies) */}
            {category === 'Stream' && (
              movies.filter(m => m.is_premiere || m.is_trending).length === 0 ? (
                <NoResultsFound />
              ) : (
                <Grid container spacing={3}>
                  {movies.filter(m => m.is_premiere || m.is_trending).map((movie) => (
                    <Grid item xs={12} sm={6} md={4} key={movie.id}>
                      <GlassmorphicCard onClick={() => navigate(`/movie/${movie.id}`)}>
                        <div style={{ position: 'relative', paddingBottom: '140%', overflow: 'hidden' }}>
                          <img
                            src={movie.poster}
                            alt={movie.title}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#38BDF8', color: '#0B0F19', padding: '3px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 900, boxShadow: '0 4px 12px rgba(56,189,248,0.4)' }}>
                            ONLINE STREAM
                          </div>
                        </div>
                        <Box p={2.5}>
                          <Typography variant="h6" fontWeight={800} noWrap>{movie.title}</Typography>
                          <Typography variant="body2" color="textSecondary" style={{ fontSize: '12px', marginTop: '2px' }} noWrap>{movie.genre}</Typography>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} mb={2}>
                            <Typography variant="caption" style={{ fontWeight: 800, color: '#38BDF8', background: 'rgba(56,189,248,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                              {movie.language}
                            </Typography>
                            <span style={{ fontSize: '15px', fontWeight: 900, color: '#FACC15' }}>₹{movie.price || '150'}</span>
                          </Box>
                          <Button size="small" variant="contained" className="bg-gradient-primary" fullWidth onClick={(e) => { e.stopPropagation(); navigate(`/movie/${movie.id}`); }} style={{ color: '#0B0F19', fontWeight: 800 }}>
                            Stream Now
                          </Button>
                        </Box>
                      </GlassmorphicCard>
                    </Grid>
                  ))}
                </Grid>
              )
            )}

            {/* Plays List (Performances) */}
            {category === 'Plays' && (
              events.filter(e => e.category === 'Performages').length === 0 ? (
                <NoResultsFound />
              ) : (
                <Grid container spacing={3}>
                  {events.filter(e => e.category === 'Performages').map((event) => (
                    <Grid item xs={12} sm={6} md={4} key={event.id}>
                      <GlassmorphicCard onClick={() => navigate(`/event/${event.id}`)}>
                        <div style={{ position: 'relative', paddingBottom: '60%', overflow: 'hidden' }}>
                          <img
                            src={event.banner}
                            alt={event.title}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#EC4899', color: '#0B0F19', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 900 }}>
                            PLAY
                          </div>
                        </div>
                        <Box p={2.5}>
                          <Typography variant="h6" fontWeight={800} style={{ fontSize: '16px' }} noWrap>{event.title}</Typography>
                          <Typography variant="body2" color="textSecondary" style={{ fontSize: '12px', marginTop: '4px' }} noWrap>{event.venue_detail?.name}</Typography>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                            <span style={{ fontSize: '16px', fontWeight: 900, color: '#FACC15' }}>₹{event.price}</span>
                            <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>{event.date}</span>
                          </Box>
                        </Box>
                      </GlassmorphicCard>
                    </Grid>
                  ))}
                </Grid>
              )
            )}

            {/* Activities List (Workshops) */}
            {category === 'Activities' && (
              events.filter(e => e.category === 'Workshops').length === 0 ? (
                <NoResultsFound />
              ) : (
                <Grid container spacing={3}>
                  {events.filter(e => e.category === 'Workshops').map((event) => (
                    <Grid item xs={12} sm={6} md={4} key={event.id}>
                      <GlassmorphicCard onClick={() => navigate(`/event/${event.id}`)}>
                        <div style={{ position: 'relative', paddingBottom: '60%', overflow: 'hidden' }}>
                          <img
                            src={event.banner}
                            alt={event.title}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#FACC15', color: '#0B0F19', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 900 }}>
                            WORKSHOP
                          </div>
                        </div>
                        <Box p={2.5}>
                          <Typography variant="h6" fontWeight={800} style={{ fontSize: '16px' }} noWrap>{event.title}</Typography>
                          <Typography variant="body2" color="textSecondary" style={{ fontSize: '12px', marginTop: '4px' }} noWrap>{event.venue_detail?.name}</Typography>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                            <span style={{ fontSize: '16px', fontWeight: 900, color: '#FACC15' }}>₹{event.price}</span>
                            <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>{event.date}</span>
                          </Box>
                        </Box>
                      </GlassmorphicCard>
                    </Grid>
                  ))}
                </Grid>
              )
            )}

            {/* Venues List (Theatres in Selected City) */}
            {category === 'Venues' && (
              theatres.length === 0 ? (
                <NoResultsFound />
              ) : (
                <Grid container spacing={3}>
                  {theatres.map((theatre) => (
                    <Grid item xs={12} sm={6} md={4} key={theatre.id}>
                      <GlassmorphicCard>
                        <div style={{ position: 'relative', paddingBottom: '50%', background: 'linear-gradient(135deg, #1E1B4B 0%, #311042 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <MapPin size={40} color="#EC4899" />
                        </div>
                        <Box p={2.5}>
                          <Typography variant="h6" fontWeight={800} noWrap>{theatre.name}</Typography>
                          <Typography variant="body2" color="textSecondary" style={{ fontSize: '12px', marginTop: '4px' }}>
                            {theatre.brand || 'Partner Venue'}
                          </Typography>
                          <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                            <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700, background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                              ACTIVE
                            </span>
                            <span style={{ fontSize: '12px', color: '#94A3B8' }}>{selectedCity}</span>
                          </Box>
                        </Box>
                      </GlassmorphicCard>
                    </Grid>
                  ))}
                </Grid>
              )
            )}

            {/* Offers List */}
            {category === 'Offers' && (
              <Grid container spacing={3}>
                {[
                  { title: "Flat 50% Off First Movie", code: "CINE50", desc: "Use code CINE50 on your first ticket checkout. Valid on all credit card payments.", exp: "Valid till 30 Jun" },
                  { title: "Buy 1 Get 1 Ticket Free", code: "BOGOPASS", desc: "Book 2 tickets and get 1 absolutely free. Applicable on selected theatres in weekend shows.", exp: "Valid till 15 Jul" },
                  { title: "RuPay Card Special: Flat ₹100 Off", code: "RUPAY100", desc: "Enjoy flat ₹100 off on ticket values above ₹300 using any RuPay Platinum Debit/Credit cards.", exp: "Valid till 31 Dec" }
                ].map((offer, idx) => (
                  <Grid item xs={12} sm={6} md={4} key={idx}>
                    <GlassmorphicCard style={{ border: '1px dashed #EC4899' }}>
                      <Box p={3} display="flex" flexDirection="column" gap="14px">
                        <Typography variant="h6" fontWeight={900} color="primary">{offer.title}</Typography>
                        <Typography variant="body2" color="textSecondary" style={{ minHeight: '60px' }}>{offer.desc}</Typography>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                          <Typography variant="subtitle2" style={{ background: 'rgba(236,72,153,0.15)', color: '#EC4899', padding: '4px 10px', borderRadius: '6px', fontWeight: 800 }}>
                            {offer.code}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">{offer.exp}</Typography>
                        </Box>
                      </Box>
                    </GlassmorphicCard>
                  </Grid>
                ))}
              </Grid>
            )}

            {/* Others List */}
            {category === 'Others' && (
              events.filter(e => e.category !== 'Performages' && e.category !== 'Workshops').length === 0 ? (
                <NoResultsFound />
              ) : (
                <Grid container spacing={3}>
                  {events.filter(e => e.category !== 'Performages' && e.category !== 'Workshops').map((event) => (
                    <Grid item xs={12} sm={6} md={4} key={event.id}>
                      <GlassmorphicCard onClick={() => navigate(`/event/${event.id}`)}>
                        <div style={{ position: 'relative', paddingBottom: '60%', overflow: 'hidden' }}>
                          <img
                            src={event.banner}
                            alt={event.title}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#38BDF8', color: '#0B0F19', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 900 }}>
                            {event.category}
                          </div>
                        </div>
                        <Box p={2.5}>
                          <Typography variant="h6" fontWeight={800} style={{ fontSize: '16px' }} noWrap>{event.title}</Typography>
                          <Typography variant="body2" color="textSecondary" style={{ fontSize: '12px', marginTop: '4px' }} noWrap>{event.venue_detail?.name}</Typography>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                            <span style={{ fontSize: '16px', fontWeight: 900, color: '#FACC15' }}>₹{event.price}</span>
                            <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>{event.date}</span>
                          </Box>
                        </Box>
                      </GlassmorphicCard>
                    </Grid>
                  ))}
                </Grid>
              )
            )}

          </Grid>
        </Grid>
      </Container>

    </Box>
  );
};

const NoResultsFound = () => (
  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={12} className="glass-panel">
    <AlertCircle size={48} color="#EC4899" style={{ marginBottom: '16px' }} />
    <Typography variant="h5" fontWeight={800} gutterBottom>No Results Found</Typography>
    <Typography variant="body2" color="textSecondary">Try adjusting your filters or location parameters.</Typography>
  </Box>
);

export default Dashboard;
