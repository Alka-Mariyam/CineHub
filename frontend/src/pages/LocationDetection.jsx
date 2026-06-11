import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, ChevronRight, Globe, Building, Landmark } from 'lucide-react';
import { Container, Box, Typography, Button, Paper, Grid } from '@mui/material';
import { setSelectedCity } from '../store';

// India states and cities data
const INDIA_DATA = {
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane", "Navi Mumbai"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hubli", "Mangaluru", "Belgaum", "Dharwad"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli", "Tirunelveli"],
  "Delhi": ["New Delhi", "Dwarka", "Rohini", "Saket", "Connaught Place"],
  "Telangana": ["Hyderabad", "Secunderabad", "Warangal", "Nizamabad", "Karimnagar"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Siliguri", "Asansol"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Bhavnagar"],
  "Rajasthan": ["Jaipur", "Udaipur", "Jodhpur", "Kota", "Ajmer", "Bikaner"],
  "Uttar Pradesh": ["Lucknow", "Noida", "Ghaziabad", "Kanpur", "Agra", "Varanasi", "Prayagraj"],
  "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kollam"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"],
  "Punjab": ["Chandigarh", "Ludhiana", "Amritsar", "Jalandhar", "Patiala"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Nellore"],
  "Bihar": ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Puri"],
  "Assam": ["Guwahati", "Dibrugarh", "Silchar", "Jorhat"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Rishikesh", "Nainital"],
  "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala", "Kullu"],
  "Jammu & Kashmir": ["Srinagar", "Jammu", "Leh", "Anantnag"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba"],
};

const POPULAR_CITIES = ["Mumbai", "Bengaluru", "New Delhi", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad"];

const LocationDetection = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [step, setStep] = useState('main'); // main, detect, manual-state, manual-city
  const [selectedState, setSelectedState] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [detectedCity, setDetectedCity] = useState('');

  const handleDetectLocation = () => {
    setDetecting(true);
    setStep('detect');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Map coordinates to nearest popular city (simplified)
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // Simple geo-mapping for Indian cities
          let city = "Mumbai";
          if (lat > 27) city = "New Delhi";
          else if (lat > 22 && lng > 87) city = "Kolkata";
          else if (lat > 17 && lng < 79) city = "Hyderabad";
          else if (lat > 12 && lng < 78) city = "Bengaluru";
          else if (lat > 12 && lng > 78) city = "Chennai";
          else if (lat > 18 && lng < 74) city = "Pune";
          else if (lat > 22 && lng < 73) city = "Ahmedabad";
          
          setTimeout(() => {
            setDetectedCity(city);
            setDetecting(false);
          }, 2000);
        },
        () => {
          // Default fallback
          setTimeout(() => {
            setDetectedCity("Mumbai");
            setDetecting(false);
          }, 2000);
        }
      );
    } else {
      setTimeout(() => {
        setDetectedCity("Mumbai");
        setDetecting(false);
      }, 2000);
    }
  };

  const handleSelectCity = (city) => {
    dispatch(setSelectedCity(city));
    localStorage.setItem('location_set', 'true');
    navigate('/');
  };

  const handleSelectState = (state) => {
    setSelectedState(state);
    setStep('manual-city');
  };

  const statesList = Object.keys(INDIA_DATA).sort();

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" position="relative" overflow="hidden" style={{ background: '#0B0F19' }}>
      {/* Animated Background Blobs */}
      <motion.div
        animate={{ x: [0, 30, -20, 0], y: [0, -20, 30, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute', top: '10%', left: '15%', width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)',
          borderRadius: '50%', zIndex: 0
        }}
      />
      <motion.div
        animate={{ x: [0, -30, 20, 0], y: [0, 20, -30, 0], scale: [1, 0.95, 1.1, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute', bottom: '10%', right: '15%', width: '350px', height: '350px',
          background: 'radial-gradient(circle, rgba(250,204,21,0.1) 0%, transparent 70%)',
          borderRadius: '50%', zIndex: 0
        }}
      />
      <motion.div
        animate={{ x: [0, 20, -15, 0], y: [0, -15, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute', top: '50%', right: '30%', width: '300px', height: '300px',
          background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)',
          borderRadius: '50%', zIndex: 0
        }}
      />

      <Container maxWidth="md" style={{ position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {/* MAIN STEP */}
          {step === 'main' && (
            <motion.div key="main" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.5 }}>
              <Box textAlign="center" mb={5}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.2 }}>
                  <Box display="inline-flex" alignItems="center" justifyContent="center" width="80px" height="80px" borderRadius="50%" mb={3}
                    style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(250,204,21,0.2))', border: '2px solid rgba(236,72,153,0.3)' }}>
                    <MapPin size={36} color="#EC4899" />
                  </Box>
                </motion.div>
                <Typography variant="h3" fontWeight={900} gutterBottom className="text-gradient">
                  Where are you?
                </Typography>
                <Typography variant="body1" color="#94A3B8" style={{ maxWidth: '500px', margin: '0 auto' }}>
                  Set your location to discover movies, events, and shows happening near you
                </Typography>
              </Box>

              {/* Detect Location Button */}
              <Box textAlign="center" mb={5}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="contained" size="large" onClick={handleDetectLocation}
                    startIcon={<Navigation size={20} />}
                    className="bg-gradient-primary glow-pink"
                    style={{ borderRadius: '14px', padding: '16px 40px', fontWeight: 800, fontSize: '16px', color: '#0B0F19' }}>
                    Detect My Location
                  </Button>
                </motion.div>
              </Box>

              <Box textAlign="center" mb={4}>
                <Typography variant="body2" color="#64748B" fontWeight={600}>or choose manually</Typography>
              </Box>

              {/* Popular Cities */}
              <Box mb={4}>
                <Typography variant="h6" fontWeight={700} mb={2} textAlign="center">
                  🔥 Popular Cities
                </Typography>
                <Grid container spacing={2} justifyContent="center">
                  {POPULAR_CITIES.map((city, idx) => (
                    <Grid item xs={6} sm={3} key={city}>
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * idx }}>
                        <Paper onClick={() => handleSelectCity(city)}
                          className="glass-card"
                          style={{ padding: '20px 16px', textAlign: 'center', cursor: 'pointer', borderRadius: '16px' }}
                          component={motion.div} whileHover={{ y: -6, borderColor: 'rgba(236,72,153,0.5)' }} whileTap={{ scale: 0.95 }}>
                          <Building size={24} color="#EC4899" style={{ marginBottom: '8px' }} />
                          <Typography variant="body1" fontWeight={700}>{city}</Typography>
                        </Paper>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Browse All States */}
              <Box textAlign="center">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button variant="outlined" size="large" onClick={() => setStep('manual-state')}
                    endIcon={<ChevronRight size={20} />}
                    style={{ borderColor: 'rgba(250,204,21,0.4)', color: '#FACC15', borderRadius: '12px', padding: '12px 32px', fontWeight: 700 }}>
                    <Globe size={18} style={{ marginRight: '8px' }} /> Browse All States
                  </Button>
                </motion.div>
              </Box>
            </motion.div>
          )}

          {/* DETECT STEP */}
          {step === 'detect' && (
            <motion.div key="detect" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.5 }}>
              <Box textAlign="center">
                {detecting ? (
                  <Box>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                      <Navigation size={60} color="#EC4899" />
                    </motion.div>
                    <Typography variant="h5" fontWeight={700} mt={4}>Detecting your location...</Typography>
                    <Typography variant="body2" color="#94A3B8" mt={1}>Please allow location access in your browser</Typography>
                  </Box>
                ) : (
                  <Box>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
                      <Box display="inline-flex" alignItems="center" justifyContent="center" width="80px" height="80px" borderRadius="50%" mb={3}
                        style={{ background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)' }}>
                        <MapPin size={36} color="#10B981" />
                      </Box>
                    </motion.div>
                    <Typography variant="h4" fontWeight={900} gutterBottom>Location Detected!</Typography>
                    <Typography variant="h5" fontWeight={700} color="primary" mb={1}>{detectedCity}</Typography>
                    <Typography variant="body2" color="#94A3B8" mb={4}>India</Typography>

                    <Box display="flex" gap="16px" justifyContent="center" flexWrap="wrap">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button variant="contained" className="bg-gradient-primary glow-pink"
                          onClick={() => handleSelectCity(detectedCity)}
                          style={{ borderRadius: '12px', padding: '14px 36px', fontWeight: 800, color: '#0B0F19', fontSize: '15px' }}>
                          Continue with {detectedCity}
                        </Button>
                      </motion.div>
                      <Button variant="outlined" onClick={() => setStep('main')}
                        style={{ borderColor: 'rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '12px', padding: '14px 28px', fontWeight: 600 }}>
                        Choose Different City
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            </motion.div>
          )}

          {/* MANUAL STATE SELECTION */}
          {step === 'manual-state' && (
            <motion.div key="states" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.5 }}>
              <Box textAlign="center" mb={4}>
                <Box display="flex" alignItems="center" justifyContent="center" gap="12px" mb={2}>
                  <Globe size={28} color="#FACC15" />
                  <Typography variant="h4" fontWeight={900}>India</Typography>
                </Box>
                <Typography variant="body1" color="#94A3B8">Select your state</Typography>
              </Box>

              <Box mb={3} textAlign="center">
                <Button variant="text" onClick={() => setStep('main')} style={{ color: '#94A3B8', fontWeight: 600 }}>
                  ← Back
                </Button>
              </Box>

              <Grid container spacing={2}>
                {statesList.map((state, idx) => (
                  <Grid item xs={6} sm={4} md={3} key={state}>
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 * idx }}>
                      <Paper onClick={() => handleSelectState(state)}
                        className="glass-card"
                        style={{ padding: '16px', cursor: 'pointer', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                        component={motion.div} whileHover={{ y: -4, borderColor: 'rgba(250,204,21,0.4)' }} whileTap={{ scale: 0.97 }}>
                        <Box display="flex" alignItems="center" gap="10px">
                          <Landmark size={16} color="#EC4899" />
                          <Typography variant="body2" fontWeight={700} style={{ fontSize: '13px' }}>{state}</Typography>
                        </Box>
                        <ChevronRight size={16} color="#64748B" />
                      </Paper>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </motion.div>
          )}

          {/* MANUAL CITY SELECTION */}
          {step === 'manual-city' && (
            <motion.div key="cities" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.5 }}>
              <Box textAlign="center" mb={4}>
                <Box display="flex" alignItems="center" justifyContent="center" gap="12px" mb={2}>
                  <Landmark size={28} color="#EC4899" />
                  <Typography variant="h4" fontWeight={900}>{selectedState}</Typography>
                </Box>
                <Typography variant="body1" color="#94A3B8">Select your city</Typography>
              </Box>

              <Box mb={3} textAlign="center">
                <Button variant="text" onClick={() => setStep('manual-state')} style={{ color: '#94A3B8', fontWeight: 600 }}>
                  ← Back to States
                </Button>
              </Box>

              <Grid container spacing={2} justifyContent="center">
                {(INDIA_DATA[selectedState] || []).map((city, idx) => (
                  <Grid item xs={6} sm={4} md={3} key={city}>
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 * idx }}>
                      <Paper onClick={() => handleSelectCity(city)}
                        className="glass-card"
                        style={{ padding: '24px 16px', textAlign: 'center', cursor: 'pointer', borderRadius: '16px' }}
                        component={motion.div} whileHover={{ y: -6, borderColor: 'rgba(236,72,153,0.5)' }} whileTap={{ scale: 0.95 }}>
                        <Building size={24} color="#FACC15" style={{ marginBottom: '8px' }} />
                        <Typography variant="body1" fontWeight={700}>{city}</Typography>
                      </Paper>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </Box>
  );
};

export default LocationDetection;
