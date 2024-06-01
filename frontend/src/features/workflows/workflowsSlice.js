import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const getWorkflowsCount = createAsyncThunk(
  'workflows/getWorkflowsCount',
  async () => {
    try {
      const response = await axios.get('http://localhost:5000/workflows/count');
      console.log(response.data.count);
      return response.data.count;
    } catch (error) {
      throw Error('Failed to fetch workflows count');
    }
  }
);

export const registerWorkflow = createAsyncThunk(
  'workflows/insert',
  async ({ name }) => {
    try {
      const response = await axios.post('http://localhost:5000/workflows/insert', { name });
      return response.data;
    } catch (error) {
      throw Error('Failed to register workflow');
    }
  }
);

export const fetchAllWorkflows = createAsyncThunk(
  'workflows/fetchAllWorkflows',
  async () => {
    const response = await axios.get('http://localhost:5000/workflows/getAll');
    return response.data;
  }
);

const workflowsSlice = createSlice({
  name: 'workflows',
  initialState: {
    count: 0,
    status: 'idle',
    error: null,
  },
  reducers: {
    // Add reducers if needed
  },
  extraReducers: (builder) => {
    builder
      .addCase(getWorkflowsCount.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getWorkflowsCount.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.count = action.payload;
      })
      .addCase(getWorkflowsCount.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchAllWorkflows.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(registerWorkflow.fulfilled, (state, action) => {
        state.status = 'succeeded';
      })
      .addCase(registerWorkflow.rejected, (state, action) => {
        state.error = action.error.message;
        state.status = 'failed';
      });
  },
});

export default workflowsSlice.reducer;
