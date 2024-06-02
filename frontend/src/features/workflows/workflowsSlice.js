import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const getWorkflowsCount = createAsyncThunk(
  'workflows/getWorkflowsCount',
  async () => {
    try {
      const response = await axios.get('http://localhost:5000/workflows/count');
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

export const deleteWorkflow = createAsyncThunk('workflows/deleteWorkflow', async (id) => {
  await axios.delete(`http://localhost:5000/workflows/delete/${id}`);
  return id;
});

export const getWorkflowState = createAsyncThunk('workflows/getWorkflowState', async (id) => {
  const response = await axios.get(`http://localhost:5000/workflows/state/${id}`);
  return response.data.state;
});

export const cancelWorkflow = createAsyncThunk('workflow/cancelWorkflow', async (id) => {
  const response = await axios.post(`http://localhost:5000/workflows/cancel/${id}`);
  return response.data; 
});

export const runWorkflow = createAsyncThunk('workflow/runWorkflow', async (id) => {
  const response = await axios.post(`http://localhost:5000/workflows/run/${id}`);
  return response.data; 
});

const workflowsSlice = createSlice({
  name: 'workflows',
  initialState: {
    count: 0,
    state: 'idle',
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
      .addCase(deleteWorkflow.fulfilled, (state, action) => {
        state.items = state.items.filter((workflow) => workflow.id !== action.payload);
        state.count -= 1;
      })
      .addCase(registerWorkflow.fulfilled, (state, action) => {
        state.status = 'succeeded';
      })
      .addCase(registerWorkflow.rejected, (state, action) => {
        state.error = action.error.message;
        state.status = 'failed';
      })
      .addCase(getWorkflowState.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.state = action.payload.state;
      })
      .addCase(cancelWorkflow.fulfilled, (state, action) => {
        console.log(action.payload);
      })
      .addCase(runWorkflow.fulfilled, (state, action) => {
        console.log(action.payload);
      });    
  },
});

export default workflowsSlice.reducer;
