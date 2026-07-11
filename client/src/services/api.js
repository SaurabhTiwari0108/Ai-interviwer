import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_URL,
});

// Add a request interceptor to inject the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const fetchMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const uploadResume = async (formData) => {
  const response = await api.post('/upload-resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const fetchGithubAnalysis = async (username) => {
  const response = await api.get(`/analyze-github/${username}`);
  return response.data;
};

export const initInterview = async () => {
  const response = await api.post('/interview/init');
  return response.data;
};

export const getInterviewStatus = async (interviewId) => {
  const response = await api.get(`/interview/${interviewId}`);
  return response.data;
};

export const startRound = async (interviewId, roundNumber) => {
  const response = await api.post(`/interview/${interviewId}/round/${roundNumber}/start`);
  return response.data;
};

export const submitRoundAnswer = async (interviewId, roundNumber, questionId, codeAnswer, voiceAnswer, language) => {
  const response = await api.post(`/interview/${interviewId}/round/${roundNumber}/submit`, {
    questionId,
    codeAnswer,
    voiceAnswer,
    language,
  });
  return response.data;
};

export const runTestCases = async (interviewId, roundNumber, questionId, codeAnswer) => {
  const response = await api.post(`/interview/${interviewId}/round/${roundNumber}/run`, {
    questionId,
    codeAnswer,
  });
  return response.data;
};

export const completeRound = async (interviewId, roundNumber) => {
  const response = await api.put(`/interview/${interviewId}/round/${roundNumber}/complete`);
  return response.data;
};

export const getUserDashboard = async (userId) => {
  const response = await api.get(`/user/dashboard/${userId}`);
  return response.data;
};
export const getFinalFeedback = async (interviewId) => {
  const response = await api.get(`/interview/${interviewId}/feedback`);
  return response.data;
};

export default api;
