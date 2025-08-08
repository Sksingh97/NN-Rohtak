import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import siteReducer from './slices/siteSlice';
import attendanceReducer from './slices/attendanceSlice';
import sweeperReducer from './slices/sweeperSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    sites: siteReducer,
    attendance: attendanceReducer,
    sweepers: sweeperReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export { store };
export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
