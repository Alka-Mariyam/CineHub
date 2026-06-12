import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Set up base Axios config
const base = import.meta.env.VITE_BACKEND_URL || import.meta.env.NEXT_PUBLIC_BACKEND_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000');
const API = axios.create({
  baseURL: base.endsWith('/api') ? base : `${base.replace(/\/$/, '')}/api`
});

// Interceptor to inject JWT Token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor to handle token refresh on 401 responses
API.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const refreshRes = await axios.post(`${base.endsWith('/api') ? base : `${base.replace(/\\/$/, '')}/api`}/auth/token/refresh/`, { refresh: refreshToken });
          const newAccess = refreshRes.data.access;
          localStorage.setItem('access_token', newAccess);
          API.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;
          originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
          return API(originalRequest);
        } catch (e) {
          // Refresh failed, clear auth and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);


// Async Thunks
export const registerUser = createAsyncThunk('auth/register', async (userData, thunkAPI) => {
  try {
    const response = await API.post('/auth/register/', userData);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || 'Registration failed');
  }
});

export const loginUser = createAsyncThunk('auth/login', async (credentials, thunkAPI) => {
  try {
    const response = await API.post('/auth/login/', credentials);
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    
    // Fetch profile after login
    const profileRes = await API.get('/auth/profile/');
    return { token: response.data, user: profileRes.data };
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || 'Login failed');
  }
});

export const fetchUserProfile = createAsyncThunk('auth/fetchProfile', async (_, thunkAPI) => {
  try {
    const response = await API.get('/auth/profile/');
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || 'Failed to fetch profile');
  }
});

export const updateUserLocation = createAsyncThunk('auth/updateLocation', async (locationId, thunkAPI) => {
  try {
    const response = await API.patch('/auth/profile/', { current_location_id: locationId });
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || 'Failed to update location');
  }
});

export const fetchLocations = createAsyncThunk('location/fetch', async (_, thunkAPI) => {
  try {
    const response = await API.get('/auth/locations/');
    return response.data.results || response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || 'Failed to fetch locations');
  }
});

// Auth Slice
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: localStorage.getItem('access_token'),
    isAuthenticated: !!localStorage.getItem('access_token'),
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('location_set');
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload.token.access;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Profile
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchUserProfile.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        localStorage.removeItem('access_token');
      })
      // Location update
      .addCase(updateUserLocation.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  }
});

// Location Slice
const locationSlice = createSlice({
  name: 'location',
  initialState: {
    selectedCity: localStorage.getItem('selected_city') || 'Mumbai',
    allLocations: [],
    loading: false,
  },
  reducers: {
    setSelectedCity: (state, action) => {
      state.selectedCity = action.payload;
      localStorage.setItem('selected_city', action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLocations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLocations.fulfilled, (state, action) => {
        state.loading = false;
        state.allLocations = action.payload;
      })
      .addCase(fetchLocations.rejected, (state) => {
        state.loading = false;
      });
  }
});

// Search Slice
const searchSlice = createSlice({
  name: 'search',
  initialState: {
    query: '',
    category: 'Movies', // Movies, Stream, Events, Plays, Sports, Activities, Venues, Offers, Others
  },
  reducers: {
    setSearchQuery: (state, action) => {
      state.query = action.payload;
    },
    setSearchCategory: (state, action) => {
      state.category = action.payload;
    }
  }
});

// Export Action Creators
export const { logout, clearError } = authSlice.actions;
export const { setSelectedCity } = locationSlice.actions;
export const { setSearchQuery, setSearchCategory } = searchSlice.actions;

// Export Axios API instance
export { API };

// Configure Redux Store
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    location: locationSlice.reducer,
    search: searchSlice.reducer,
  },
});
