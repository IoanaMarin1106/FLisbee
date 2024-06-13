import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchModels = createAsyncThunk('models/fetchModels', async () => {
  const response = await axios.get('http://localhost:5000/models/getAll');
  return response.data;
});

export const addModel = createAsyncThunk('models/addModel', async ({ name, description, file, userEmail }) => {
  const filename = file.name;
  const response = await axios.post('http://localhost:5000/models/insert', { name, description, filename, user_email: userEmail });

  console.log(filename);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', filename);
  formData.append('user_email', userEmail);
  formData.append('model_id', response.data.id);

  try {
    const uploadMsg = await axios.post('http://localhost:5000/upload/model', formData , {
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
  await axios.delete(`http://localhost:5000/models/delete/${id}`);
  return id;
});

export const getUserModels = createAsyncThunk('models/getUserModels', async (userEmail) => {
  const response = await axios.get(`http://localhost:5000/models/getUserModels/${userEmail}`);
  return response.data;
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
    userModels: [],
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
        .addCase(getUserModels.fulfilled, (state, action) => {
          state.status = 'succeeded';
          state.userModels = action.payload;
        })
        .addCase(fetchModels.fulfilled, (state, action) => {
            state.status = 'succeeded';
            state.items = action.payload;
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
