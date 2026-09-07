/**
 * @file interview.api.js (Frontend API)
 * @description API client methods for initiating mock interviews, submitting answers,
 * and fetching evaluations and aggregated radar performance statistics.
 */

import api from '../utils/axios';

/**
 * Initiates a new mock interview session with the chosen role, track, and optional resume.
 * 
 * @param {{ type: string, role: string, useResume?: boolean, resume?: object }} data
 * @returns {Promise<object>} Started interview data including first question
 */
export const startInterview = async (data) => {
  try {
    const response = await api.post('/api/interview/start', data);
    return response.data;
  } catch (error) {
    console.error('startInterview error:', error);
    return error.response?.data || { success: false, message: error.message || 'Failed to start interview' };
  }
};

/**
 * Submits the candidate's response for the current interview question.
 * 
 * @param {{ interviewId: string, answer: string }} data
 * @returns {Promise<object>} Evaluation feedback, next question, or final report
 */
export const submitAnswer = async (data) => {
  try {
    const response = await api.post('/api/interview/answer', data);
    return response.data;
  } catch (error) {
    console.error('submitAnswer error:', error);
    return error.response?.data || { success: false, message: error.message || 'Failed to submit answer' };
  }
};

/**
 * Retrieves details and full question breakdown for a specific interview.
 * 
 * @param {string} id - Interview ID
 * @returns {Promise<object>} Interview document and report
 */
export const getInterview = async (id) => {
  try {
    const response = await api.get(`/api/interview/${id}`);
    return response.data;
  } catch (error) {
    console.error('getInterview error:', error);
    return error.response?.data || { success: false, message: error.message || 'Failed to fetch interview' };
  }
};

/**
 * Retrieves all mock interviews for the candidate with aggregated skill radar analytics.
 * 
 * @returns {Promise<object|null>} Dashboard metrics payload
 */
export const getAllInterviews = async () => {
  try {
    const response = await api.get('/api/interview/all');
    return response.data;
  } catch (error) {
    console.error('getAllInterviews error:', error);
    return null;
  }
};
