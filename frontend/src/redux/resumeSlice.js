/**
 * @file resumeSlice.js (Frontend Redux Slice)
 * @description Redux Toolkit slice managing candidate resume state for the builder and preview templates.
 */

import { createSlice } from "@reduxjs/toolkit";

const resumeSlice = createSlice({
    name: "resume",
    initialState: {
        resume: null
    },
    reducers: {
        /**
         * Sets the active resume payload in Redux state.
         * @param {object} state - Current Redux slice state
         * @param {{ payload: object|null }} action - Redux action containing resume data
         */
        setResume(state, action) {
            state.resume = action.payload;
        }
    }
});

export const { setResume } = resumeSlice.actions;
export default resumeSlice.reducer;