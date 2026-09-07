/**
 * @file store.js (Frontend Redux Store)
 * @description Central Redux store configuration for the client application.
 */

import { configureStore } from '@reduxjs/toolkit';
import resumeReducer from "./resumeSlice.js";

export const store = configureStore({
  reducer: {
    resume: resumeReducer
  }
});