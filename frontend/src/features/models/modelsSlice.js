import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchModels = createAsyncThunk('models/fetchModels', async () => {
  const response = await axios.get('http://localhost:5000/models/getAll');
  return response.data;
});

export const addModel = createAsyncThunk('models/addModel', async ({ name, file }) => {
  const filename = file.name;
  const response = await axios.post('http://localhost:5000/models/insert', { name, filename });

  console.log(filename);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', filename);

  try {
    const uploadMsg = await axios.post('http://localhost:5000/upload/model', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    console.log("Upload message: " + JSON.stringify(uploadMsg.data));
    
  } catch (error) {
    console.error('Error adding model:', error);
  }

  return response.data;
});

export const deleteModel = createAsyncThunk('models/deleteModel', async (id) => {
console.log("model id " + id);
  await axios.delete(`http://localhost:5000/models/delete/${id}`);
  return id;
});

export const getModelsCount = createAsyncThunk(
    'models/getModelsCount',
    async () => {
      try {
        const response = await axios.get('http://localhost:5000/models/count');
        return response.data.count;
      } catch (error) {
        throw Error('Failed to fetch workflows count');
      }
    }
  );

const modelsSlice = createSlice({
  name: 'models',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
        .addCase(getModelsCount.pending, (state) => {
            state.status = 'loading';
        })
        .addCase(getModelsCount.fulfilled, (state, action) => {
            state.status = 'succeeded';
            state.count = action.payload;
        })
        .addCase(getModelsCount.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.error.message;
        })
        .addCase(fetchModels.pending, (state) => {
            state.status = 'loading';
        })
        .addCase(fetchModels.fulfilled, (state, action) => {
            state.status = 'succeeded';
            state.items = action.payload;
        })
        .addCase(fetchModels.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.error.message;
        })
        .addCase(addModel.fulfilled, (state, action) => {
          console.log(action.payload);
          state.items.push({
              name: action.payload.name,
              fileName: action.payload.filename,
              id: action.payload.id 
          });
        })
        .addCase(deleteModel.fulfilled, (state, action) => {
            state.items = state.items.filter((model) => model._id !== action.payload);
        });
  },
});

export default modelsSlice.reducer;
