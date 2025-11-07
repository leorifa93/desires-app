import { createSlice } from '@reduxjs/toolkit';

// Ensure Redux state stays serializable by converting Date / Firestore Timestamp
const serializeValue = (value) => {
  if (value && typeof value.toDate === 'function') {
    try { return value.toDate().toISOString(); } catch { return String(value); }
  }
  if (value instanceof Date) {
    try { return value.toISOString(); } catch { return String(value); }
  }
  return value;
};

const serializeObject = (input) => {
  if (input === null || input === undefined) return input;
  if (Array.isArray(input)) return input.map(serializeObject);
  if (typeof input === 'object') {
    const out = {};
    for (const key in input) {
      const v = input[key];
      if (v && typeof v === 'object') {
        out[key] = serializeObject(v);
      } else {
        out[key] = serializeValue(v);
      }
    }
    return out;
  }
  return serializeValue(input);
};

const initialState = {
  user: null,
  error: null,
  isAuthenticated: false,
  loading: true,
  dataLoaded: false
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      console.log('setUser reducer called with action:', action);
      // Handle both old format (direct user object) and new format ({ user, dataLoaded })
      // IMPORTANT: If payload has the 'user' key, even if it's null, use it instead of falling back
      const hasUserKey = action && action.payload && Object.prototype.hasOwnProperty.call(action.payload, 'user');
      const userData = hasUserKey ? action.payload.user : action.payload;
      console.log('setUser reducer userData:', userData);

      const serializedUser = userData === null ? null : (userData ? serializeObject(userData) : null);
      console.log('setUser reducer serializedUser:', serializedUser);

      state.user = serializedUser;
      state.isAuthenticated = !!serializedUser;
      state.loading = false;
      if (hasUserKey && Object.prototype.hasOwnProperty.call(action.payload, 'dataLoaded')) {
        state.dataLoaded = action.payload.dataLoaded;
      } else if (serializedUser) {
        state.dataLoaded = true; // user updates default to loaded
      }

      console.log('setUser reducer final state.user:', state.user);
    },
    loginSuccess: (state, action) => {
      state.user = action.payload;
      state.error = null;
    },
    loginError: (state, action) => {
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.error = null;
      state.isAuthenticated = false;
    },
    saveSignedInUser: (state, action) => {
      state.signedInUser = action.payload;
    }
  }
});

export const {
  setUser,
  loginSuccess,
  loginError,
  logout,
  saveSignedInUser
} = authSlice.actions;

export default authSlice.reducer;
