import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import workflowsReducer from '../features/workflows/workflowsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workflows: workflowsReducer,
  },
});