/**
 * API Configuration
 * Centralized API endpoint configuration for different environments
 */

// Backend API base URL
// In development: uses local server
// In production: uses deployed backend (Railway, Render, etc.)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// WebSocket URL
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:3000';

// API endpoints
export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/api/v1/portal/auth/login`,
    signup: `${API_BASE_URL}/api/v1/portal/auth/signup`,
    logout: `${API_BASE_URL}/api/v1/portal/auth/logout`,
  },
  games: {
    list: `${API_BASE_URL}/api/v1/portal/games`,
    get: (gameId: string) => `${API_BASE_URL}/api/v1/portal/games/${gameId}`,
    create: `${API_BASE_URL}/api/v1/portal/games`,
  },
  userGameData: {
    get: (gameId: string) => `${API_BASE_URL}/api/v1/portal/user_game_data/${gameId}`,
    update: (gameId: string) => `${API_BASE_URL}/api/v1/portal/user_game_data/${gameId}`,
  },
  leaderboards: {
    get: (gameId: string) => `${API_BASE_URL}/api/v1/portal/leaderboards/${gameId}`,
    submit: (gameId: string) => `${API_BASE_URL}/api/v1/portal/leaderboards/${gameId}/submit`,
  },
  audit: {
    log: `${API_BASE_URL}/api/v1/portal/audit`,
  },
};

export default API_ENDPOINTS;
