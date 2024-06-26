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
  'workflows/precreate',
  async ({ name, ml_model, training_frequency, user_email }) => {
    try {
      const response = await axios.post('http://localhost:5000/workflows/precreate', { name, ml_model, training_frequency, user_email });
      return response.data;
    } catch (error) {
      throw Error('Failed to register workflow');
    }
  }
);

export const createWorkflow = createAsyncThunk(
  'workflows/create',
  async ({ name, workflow_id, ml_model, training_frequency, user_email }) => {
    try {
      const response = await axios.post('http://localhost:5000/workflows/create', { name, workflow_id, ml_model, training_frequency, user_email });
      return response.data;
    } catch (error) {
      throw Error('Failed to create workflow');
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

export const getWorkflowStatus = createAsyncThunk('workflows/getWorkflowStatus', async (id) => {
  const response = await axios.get(`http://localhost:5000/workflows/status/${id}`);
  return response.data;
});

export const getWorkflowLogs = createAsyncThunk('workflows/getWorkflowLogs', async (id) => {
  const response = await axios.get(`http://localhost:5000/workflows/logs/${id}`);
  return response.data;
});

export const registerWorkflowCancel = createAsyncThunk('workflow/registerWorkflowCancel', async (id) => {
  const response = await axios.post(`http://localhost:5000/workflows/register/cancel/${id}`);
  return response.data;
});

export const cancelWorkflow = createAsyncThunk('workflow/cancelWorkflow', async (id) => {
  const response = await axios.post(`http://localhost:5000/workflows/cancel/${id}`);
  return response.data; 
});

export const registerWorkflowRun = createAsyncThunk('workflow/registerWorkflowRun', async (id) => {
  const response = await axios.post(`http://localhost:5000/workflows/register/run/${id}`);
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
    items: [],
    logs: []
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
      .addCase(createWorkflow.fulfilled, (state, action) => {
        state.status = 'succeeded';
      })
      .addCase(createWorkflow.rejected, (state, action) => {
        state.error = action.error.message;
        state.status = 'failed';
      })
      .addCase(registerWorkflow.fulfilled, (state, action) => {
        state.status = 'succeeded';
      })
      .addCase(registerWorkflow.rejected, (state, action) => {
        state.error = action.error.message;
        state.status = 'failed';
      })
      .addCase(getWorkflowStatus.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { id, status } = action.payload;
        state.items = state.items.map(workflow =>
          workflow.id === id ? { ...workflow, status } : workflow
        );
      })
      .addCase(getWorkflowLogs.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.logs = action.payload;
      })
      .addCase(registerWorkflowCancel.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const id = action.payload.id;
        const status = 'Canceling';
        state.items = state.items.map(workflow =>
          workflow.id === id ? { ...workflow, status } : workflow
        );
      })
      .addCase(cancelWorkflow.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const id = action.payload.id;
        const status = 'Canceled';
        state.items = state.items.map(workflow =>
          workflow.id === id ? { ...workflow, status } : workflow
        );
      })
      .addCase(runWorkflow.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const id = action.payload.id;
        const status = 'Running';
        console.log("id: ", JSON.stringify(action.payload))
        console.log("Items before: ", JSON.stringify(state.items))
        state.items = state.items.map(workflow =>
          workflow.id === id ? { ...workflow, status } : workflow
        );
        console.log("Items after: ", JSON.stringify(state.items))
      })
      .addCase(registerWorkflowRun.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const id = action.payload.id;
        const status = 'Provisioning';
        state.items = state.items.map(workflow =>
          workflow.id === id ? { ...workflow, status } : workflow
        );
      });
  },
});

export default workflowsSlice.reducer;
