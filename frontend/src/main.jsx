import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App.jsx';
import { store } from './store';
import './index.css';

// Custom MUI theme to match the Netflix + BookMyShow glassmorphism design
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#EC4899', // Vibrant Pink
      light: '#F472B6',
      dark: '#BE185D',
    },
    secondary: {
      main: '#FACC15', // Neon Yellow
      light: '#FDE047',
      dark: '#CA8A04',
    },
    background: {
      default: '#0B0F19', // Space Dark Navy
      paper: '#161F30', // Space Dark Card
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#94A3B8',
    },
    success: {
      main: '#10B981', // Emerald Green for Available seats
    },
    warning: {
      main: '#FACC15', // Neon Yellow for Reserved/Pending seats
    },
    error: {
      main: '#EF4444', // Red for Booked seats
    },
  },
  typography: {
    fontFamily: "'Outfit', 'Inter', 'Roboto', sans-serif",
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 500 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1E293B',
          borderRadius: 16,
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);
