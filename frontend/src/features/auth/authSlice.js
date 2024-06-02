import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }) => {
    const response = await axios.post('http://localhost:5000/login', { email, password });
    const { access_token, username } = response.data;
    localStorage.setItem('token', access_token); // Save token in local storage
    localStorage.setItem('username', username); // Save username in local storage
    return response.data;
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ email, password }) => {
    const response = await axios.post('http://localhost:5000/register', { email, password });
    return response.data;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: null, status: 'idle', error: null },
  reducers: {
    logout(state) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      state.user = null;
      state.token = null;
    },
    setCredentials(state, action) {
      state.user = action.payload.user;
      state.token = action.payload.token;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.fulfilled, (state, action) => {
        state.token = action.payload.access_token;
        state.status = 'succeeded';
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.error = action.error.message;
        state.status = 'failed';
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.error = action.error.message;
        state.status = 'failed';
      });
  }
});

export const { logout, setCredentials } = authSlice.actions;

export default authSlice.reducer;
