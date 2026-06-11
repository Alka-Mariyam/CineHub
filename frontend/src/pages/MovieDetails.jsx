import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Play, Star, Calendar, Clock, MapPin, Tag, Award, Users, MessageSquare, Heart, Share2, ChevronRight } from 'lucide-react';
import { Container, Grid, Box, Typography, Button, TextField, Divider, Paper, Select, MenuItem } from '@mui/material';
import GlassmorphicCard from '../components/GlassmorphicCard';
import { API } from '../store';

const MovieDetails = ({ type = 'movie' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { selectedCity } = useSelector((state) => state.location);

  const [item, setItem] = useState(null);
  const [shows, setShows] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [insights, setInsights] = useState(null);
  const [similarMovies, setSimilarMovies] = useState([]);
  
  // Review form state
  const [rating, setRating] = useState(10);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');

  const [loading, setLoading] = useState(true);

  const isReserveOnly = new URLSearchParams(location.search).get('reserve') === 'true';

  useEffect(() => {
    setLoading(true);
    let itemUrl = '';
    let showsUrl = '';
    let reviewsUrl = '';

    if (type === 'movie') {
      itemUrl = `/movies/${id}/`;
      showsUrl = `/shows/?movie=${id}&city=${selectedCity}`;
      reviewsUrl = `/reviews/?movie=${id}`;
    } else if (type === 'event') {
      itemUrl = `/events/${id}/`;
      showsUrl = `/shows/?event=${id}&city=${selectedCity}`;
      reviewsUrl = `/reviews/?event=${id}`;
    } else {
      itemUrl = `/sports/${id}/`;
      showsUrl = `/shows/?sports_event=${id}&city=${selectedCity}`;
      reviewsUrl = `/reviews/?sports_event=${id}`;
    }

    // Fetch details
    Promise.all([
      API.get(itemUrl),
      API.get(showsUrl),
      API.get(reviewsUrl),
      API.get(`/reviews/insights/?${type === 'movie' ? 'movie' : (type === 'event' ? 'event' : 'sports_event')}=${id}`)
    ])
      .then(([itemRes, showsRes, reviewsRes, insightsRes]) => {
        setItem(itemRes.data);
        setShows(showsRes.data.results || showsRes.data);
        setReviews(reviewsRes.data.results || reviewsRes.data);
        setInsights(insightsRes.data);
        setLoading(false);

        // Fetch similar movies by genre
        if (type === 'movie' && itemRes.data.genre) {
          const genre = itemRes.data.genre.split(',')[0].trim();
          API.get(`/movies/?search=${genre}`)
            .then((res) => {
              const list = (res.data.results || res.data).filter(m => m.id !== parseInt(id));
              setSimilarMovies(list.slice(0, 6));
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        setLoading(false);
      });
  }, [id, type, selectedCity]);

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    setReviewError('');
    if (!comment.trim()) {
      setReviewError('Please write a review comment.');
      return;
    }

    const reviewData = {
      rating,
      comment,
      ...(type === 'movie' && { movie: id }),
      ...(type === 'event' && { event: id }),
      ...(type === 'sports' && { sports_event: id })
    };

    API.post('/reviews/', reviewData)
      .then((res) => {
        setComment('');
        // Reload reviews and insights
        const reviewsUrl = `/reviews/?${type === 'movie' ? 'movie' : (type === 'event' ? 'event' : 'sports_event')}=${id}`;
        API.get(reviewsUrl).then((r) => setReviews(r.data.results || r.data));
        API.get(`/reviews/insights/?${type === 'movie' ? 'movie' : (type === 'event' ? 'event' : 'sports_event')}=${id}`).then((ins) => setInsights(ins.data));
      })
      .catch((err) => {
        setReviewError(err.response?.data?.detail || 'You must be signed in to post a review.');
      });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Play size={40} color="#EC4899" />
        </motion.div>
      </Box>
    );
  }

  if (!item) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <Typography variant="h6">Item not found.</Typography>
      </Box>
    );
  }

  const title = item.title;
  const poster = item.poster || item.banner;
  const ratingVal = item.rating || 0.0;
  const votes = item.votes || 0;

  // Group shows by Theatre or Venue
  const groupedShows = shows.reduce((acc, show) => {
    const key = show.theatre_detail ? show.theatre_detail.name : (show.venue_name || "Venue");
    if (!acc[key]) acc[key] = [];
    acc[key].push(show);
    return acc;
  }, {});

  return (
    <Box>
      {/* Backdrop Section */}
      <Box position="relative" height="420px" style={{ background: '#090D1A', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundImage: `url(${poster})`, backgroundSize: 'cover', backgroundPosition: 'center',
            filter: 'blur(20px) brightness(0.35)', transform: 'scale(1.1)'
          }}
        />
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '60%',
          background: 'linear-gradient(to top, #0B0F19 0%, transparent 100%)', zIndex: 1 }} />

        <Container maxWidth="lg" style={{ height: '100%', display: 'flex', alignItems: 'center', position: 'relative', zIndex: 2 }}>
          <Grid container spacing={4} alignItems="center">
            {/* Poster image */}
            <Grid item xs={12} sm={3} display={{ xs: 'none', sm: 'block' }}>
              <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                <Box boxShadow="0 12px 36px rgba(0,0,0,0.6)" borderRadius="16px" overflow="hidden" height="300px"
                  style={{ border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                  <img src={poster} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {shows.length > 0 && (
                    <Box position="absolute" bottom="12px" left="12px" right="12px" p="8px 14px" borderRadius="10px"
                      style={{ background: 'rgba(11,15,25,0.85)', backdropFilter: 'blur(10px)', border: '1px solid rgba(250,204,21,0.3)' }}>
                      <Typography variant="caption" color="#94A3B8" display="block" style={{ fontSize: '10px' }}>Starting from</Typography>
                      <Typography variant="h6" fontWeight={900} style={{ color: '#FACC15' }}>
                        ₹{Math.min(...shows.map(s => parseFloat(s.price))).toFixed(0)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </motion.div>
            </Grid>
            {/* Details */}
            <Grid item xs={12} sm={9}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                <Typography variant="h3" fontWeight={800} gutterBottom style={{ textShadow: '0 4px 16px rgba(0,0,0,0.6)' }}>
                  {title}
                </Typography>
                
                <Box display="flex" flexWrap="wrap" gap="20px" alignItems="center" mb={2}>
                  {/* Rating */}
                  <Box display="flex" alignItems="center" gap="6px" p="6px 14px" borderRadius="8px"
                    style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
                    <Star size={18} color="#F59E0B" fill="#F59E0B" />
                    <Typography variant="body1" fontWeight={800} style={{ color: '#F59E0B' }}>{ratingVal}</Typography>
                    <Typography variant="caption" color="#94A3B8">({votes} ratings)</Typography>
                  </Box>
                  {/* Duration */}
                  {item.duration && (
                    <Box display="flex" alignItems="center" gap="6px">
                      <Clock size={16} color="#EC4899" />
                      <Typography variant="body2" fontWeight={600}>{item.duration} mins</Typography>
                    </Box>
                  )}
                  {/* Language */}
                  {item.language && (
                    <Box p="4px 12px" borderRadius="6px" style={{ background: 'rgba(236,72,153,0.15)', border: '1px solid rgba(236,72,153,0.3)' }}>
                      <Typography variant="body2" color="primary" fontWeight={700}>{item.language}</Typography>
                    </Box>
                  )}
                  {/* Genre */}
                  {item.genre && (
                    <Box display="flex" alignItems="center" gap="6px">
                      <Tag size={14} color="#7C3AED" />
                      <Typography variant="body2" color="#CBD5E1" fontWeight={600}>{item.genre}</Typography>
                    </Box>
                  )}
                  {/* Date for Events/Sports */}
                  {item.date && (
                    <Box display="flex" alignItems="center" gap="6px">
                      <Calendar size={16} color="#7C3AED" />
                      <Typography variant="body2">{item.date}</Typography>
                    </Box>
                  )}
                </Box>

                {/* Synopsis */}
                <Typography variant="body1" color="#CBD5E1" mb={3} style={{ maxWidth: '700px', fontSize: '15px', lineHeight: '1.7' }}>
                  {item.synopsis || item.description}
                </Typography>

                {/* Action buttons */}
                <Box display="flex" gap="14px" flexWrap="wrap">
                  {item.trailer && (
                    <Button variant="contained" startIcon={<Play size={18} />}
                      className="bg-gradient-primary glow-pink"
                      onClick={() => document.getElementById('trailer-section')?.scrollIntoView({ behavior: 'smooth' })}
                      style={{ borderRadius: '10px', padding: '12px 28px', fontWeight: 800, color: '#0B0F19' }}>
                      Watch Trailer
                    </Button>
                  )}
                  <Button variant="outlined"
                    onClick={() => {
                      const el = document.getElementById('shows-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{ borderColor: '#FACC15', color: '#FACC15', borderRadius: '10px', padding: '12px 28px', fontWeight: 700 }}>
                    Book Tickets
                  </Button>
                </Box>

                {/* Offers */}
                <Box display="flex" alignItems="center" gap="10px" p="10px 16px" mt={3}
                  style={{ background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.2)', borderRadius: '10px', width: 'fit-content' }}>
                  <Tag size={16} color="#FACC15" />
                  <Typography variant="caption" fontWeight={600} style={{ color: '#FACC15' }}>
                    OFFER: Get 10% cashback using reward points or gift card CINE100
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" style={{ marginTop: '40px', paddingBottom: '60px' }}>
        <Grid container spacing={4}>
          
          {/* Left Column (Shows & Cast & Trailer & Similar) */}
          <Grid item xs={12} md={8}>
            
            {/* Show timings list */}
            <Box mb={5} id="shows-section">
              <Typography variant="h5" fontWeight={700} mb={3} display="flex" alignItems="center" gap="8px">
                🎬 Select Show Timings
                {isReserveOnly && <span style={{ color: '#F59E0B', fontSize: '14px' }}>(Book Later Mode)</span>}
              </Typography>
              
              {Object.keys(groupedShows).length === 0 ? (
                <Paper style={{ padding: '24px', background: '#1E293B', textAlign: 'center', borderRadius: '16px' }}>
                  <Typography variant="body1" color="textSecondary">
                    No shows scheduled for the selected location.
                  </Typography>
                </Paper>
              ) : (
                <Box display="flex" flexDirection="column" gap="20px">
                  {Object.keys(groupedShows).map((place) => (
                    <motion.div key={place} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Box p={3} className="glass-panel">
                        <Box display="flex" alignItems="center" gap="8px" mb={2}>
                          <MapPin size={16} color="#EC4899" />
                          <Typography variant="h6" fontWeight={700}>{place}</Typography>
                        </Box>
                        <Box display="flex" gap="12px" flexWrap="wrap">
                          {groupedShows[place].map((show) => {
                            const dateObj = new Date(show.start_time);
                            const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            const formattedDate = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
                            return (
                              <motion.div key={show.id} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                                <Button variant="outlined"
                                  onClick={() => navigate(`/booking/${type}/${show.id}${location.search}`)}
                                  style={{
                                    color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.15)',
                                    background: 'rgba(255,255,255,0.02)', borderRadius: '12px',
                                    padding: '12px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    transition: 'all 0.3s ease'
                                  }}>
                                  <span style={{ fontSize: '15px', fontWeight: 700 }}>{formattedTime}</span>
                                  <span style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>{formattedDate}</span>
                                  <span style={{ fontSize: '12px', color: '#EC4899', fontWeight: 700, marginTop: '4px' }}>₹{show.price}</span>
                                </Button>
                              </motion.div>
                            );
                          })}
                        </Box>
                      </Box>
                    </motion.div>
                  ))}
                </Box>
              )}
            </Box>

            {/* Trailer embed */}
            {item.trailer && (
              <Box mb={5} id="trailer-section">
                <Typography variant="h5" fontWeight={700} mb={3} display="flex" alignItems="center" gap="8px">
                  ▶️ Official Trailer
                </Typography>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '16px', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <iframe
                      title={`${title} Trailer`}
                      src={item.trailer}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                      allowFullScreen
                    />
                  </div>
                </motion.div>
              </Box>
            )}

            {/* Cast & Crew */}
            {type === 'movie' && item.cast && item.cast.length > 0 && (
              <Box mb={5}>
                <Typography variant="h5" fontWeight={700} mb={3}>🎭 Cast & Crew</Typography>
                <Grid container spacing={2}>
                  {item.cast.map((actor, idx) => (
                    <Grid item xs={6} sm={3} key={`cast-${idx}`}>
                      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * idx }}>
                        <Box p={2} className="glass-panel" textAlign="center">
                          <Box width="72px" height="72px" borderRadius="50%" overflow="hidden" mx="auto" mb={1}
                            style={{ border: '2px solid rgba(236,72,153,0.3)' }}>
                            <img src={actor.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} alt={actor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </Box>
                          <Typography variant="body2" fontWeight={700} noWrap>{actor.name}</Typography>
                          <Typography variant="caption" color="textSecondary" noWrap>as {actor.role}</Typography>
                        </Box>
                      </motion.div>
                    </Grid>
                  ))}
                  {item.crew && item.crew.map((member, idx) => (
                    <Grid item xs={6} sm={3} key={`crew-${idx}`}>
                      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * (item.cast.length + idx) }}>
                        <Box p={2} className="glass-panel" textAlign="center">
                          <Box width="72px" height="72px" borderRadius="50%" overflow="hidden" mx="auto" mb={1}
                            style={{ border: '2px solid rgba(250,204,21,0.3)' }}>
                            <img src={member.image || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100"} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </Box>
                          <Typography variant="body2" fontWeight={700} noWrap>{member.name}</Typography>
                          <Typography variant="caption" color="secondary" noWrap>{member.role}</Typography>
                        </Box>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Similar Movies */}
            {similarMovies.length > 0 && (
              <Box mb={5}>
                <Typography variant="h5" fontWeight={700} mb={3}>🎬 Similar Movies</Typography>
                <Grid container spacing={2}>
                  {similarMovies.map((movie) => (
                    <Grid item xs={6} sm={4} md={4} key={movie.id}>
                      <GlassmorphicCard onClick={() => navigate(`/movie/${movie.id}`)}>
                        <div style={{ position: 'relative', paddingBottom: '140%', overflow: 'hidden' }}>
                          <img src={movie.poster} alt={movie.title}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                            className="card-img-hover" />
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0,
                            background: 'linear-gradient(to top, rgba(11,15,25,0.95) 0%, transparent 100%)',
                            padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box display="flex" alignItems="center" gap="4px">
                              <Star size={14} color="#FACC15" fill="#FACC15" />
                              <span style={{ fontSize: '13px', fontWeight: 800, color: '#FACC15' }}>{movie.rating}</span>
                            </Box>
                          </div>
                        </div>
                        <Box p={2}>
                          <Typography variant="body2" fontWeight={800} noWrap>{movie.title}</Typography>
                          <Typography variant="caption" color="textSecondary" noWrap>{movie.genre}</Typography>
                        </Box>
                      </GlassmorphicCard>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Grid>

          {/* Right Column (Reviews & Sentiment) */}
          <Grid item xs={12} md={4}>
            
            {/* Sentiment Insights */}
            {insights && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                <Box p={3} mb={4} className="glass-panel">
                  <Typography variant="h6" fontWeight={700} gutterBottom display="flex" alignItems="center" gap="8px">
                    <Award size={18} color="#7C3AED" />
                    Sentiment Analysis
                  </Typography>
                  <Divider style={{ background: 'rgba(255,255,255,0.08)', margin: '12px 0' }} />
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" color="textSecondary">Overall Sentiment</Typography>
                    <Typography variant="body2" fontWeight={700} color="primary">{insights.overall_sentiment}</Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2" color="textSecondary">Average Rating</Typography>
                    <Box display="flex" alignItems="center" gap="4px">
                      <Star size={14} color="#F59E0B" fill="#F59E0B" />
                      <span style={{ fontWeight: 700 }}>{insights.average_rating} / 10</span>
                    </Box>
                  </Box>

                  {/* Progress Bars */}
                  <Box mt={2}>
                    <Typography variant="caption" color="textSecondary" display="block" mb={0.5}>Positive ({insights.positive_percentage}%)</Typography>
                    <div style={{ height: '8px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${insights.positive_percentage}%` }} transition={{ duration: 1, delay: 0.5 }}
                        style={{ height: '100%', background: 'linear-gradient(90deg, #10B981, #34D399)', borderRadius: '4px' }} />
                    </div>
                  </Box>

                  <Box mt={2}>
                    <Typography variant="caption" color="textSecondary" display="block" mb={0.5}>Negative ({insights.negative_percentage}%)</Typography>
                    <div style={{ height: '8px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${insights.negative_percentage}%` }} transition={{ duration: 1, delay: 0.7 }}
                        style={{ height: '100%', background: 'linear-gradient(90deg, #EF4444, #F87171)', borderRadius: '4px' }} />
                    </div>
                  </Box>
                </Box>
              </motion.div>
            )}

            {/* Write a review */}
            <Box p={3} mb={4} className="glass-panel" component="form" onSubmit={handleReviewSubmit}>
              <Typography variant="h6" fontWeight={700} mb={2}>✍️ Write a Review</Typography>
              
              <Box display="flex" alignItems="center" gap="10px" mb={2}>
                <Typography variant="body2" color="textSecondary">Rating:</Typography>
                <Select
                  size="small"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  style={{ background: 'rgba(15,23,42,0.4)', color: '#FFF', borderRadius: '8px' }}
                >
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((r) => (
                    <MenuItem key={r} value={r}>{r} / 10</MenuItem>
                  ))}
                </Select>
              </Box>

              <TextField
                fullWidth multiline rows={3}
                placeholder="Share your thoughts about this show..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                InputProps={{
                  style: { background: 'rgba(15,23,42,0.4)', color: '#FFFFFF', borderRadius: '10px' }
                }}
              />

              {reviewError && (
                <Typography variant="caption" color="error" display="block" mt={1}>
                  {reviewError}
                </Typography>
              )}

              <Button type="submit" variant="contained" className="bg-gradient-primary" fullWidth
                style={{ marginTop: '16px', borderRadius: '10px', fontWeight: 700, color: '#0B0F19' }}>
                Submit Review
              </Button>
            </Box>

            {/* Comments List */}
            <Box>
              <Typography variant="h6" fontWeight={700} mb={2} display="flex" alignItems="center" gap="8px">
                <MessageSquare size={18} />
                User Reviews ({reviews.length})
              </Typography>
              
              {reviews.length === 0 ? (
                <Typography variant="body2" color="textSecondary">No reviews posted yet. Be the first!</Typography>
              ) : (
                <Box display="flex" flexDirection="column" gap="14px">
                  {reviews.map((rev) => (
                    <motion.div key={rev.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Box p={2.5} className="glass-panel">
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="body2" fontWeight={700}>{rev.user_detail?.full_name || "CineHub User"}</Typography>
                          <Box display="flex" alignItems="center" gap="4px" p="2px 8px" borderRadius="6px"
                            style={{ background: 'rgba(245,158,11,0.15)' }}>
                            <Star size={12} color="#F59E0B" fill="#F59E0B" />
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#F59E0B' }}>{rev.rating}/10</span>
                          </Box>
                        </Box>
                        <Typography variant="body2" color="#E2E8F0" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                          {rev.comment}
                        </Typography>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1.5}>
                          <span style={{
                            fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                            color: rev.sentiment === 'Positive' ? '#10B981' : (rev.sentiment === 'Negative' ? '#EF4444' : '#94A3B8'),
                            background: rev.sentiment === 'Positive' ? 'rgba(16,185,129,0.1)' : (rev.sentiment === 'Negative' ? 'rgba(239,68,68,0.1)' : 'rgba(148,163,184,0.1)')
                          }}>
                            {rev.sentiment}
                          </span>
                          <Typography variant="caption" color="textSecondary" style={{ fontSize: '10px' }}>
                            {new Date(rev.created_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    </motion.div>
                  ))}
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default MovieDetails;
