import { jwtVerify, SignJWT } from 'jose';
import { setCookie, getCookie, deleteCookie } from 'cookies-next';

// Constants
const TOKEN_NAME = 'auth_token';
const MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Creates a JWT token
 * @param {Object} payload - The data to encode in the token
 * @returns {Promise<string>} - The JWT token
 */
export async function createToken(payload) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret);
    
  return token;
}

/**
 * Verifies a JWT token
 * @param {string} token - The token to verify
 * @returns {Promise<Object>} - The decoded token payload
 */
export async function verifyToken(token) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Invalid token');
  }
}

/**
 * Sets the authentication token in cookies
 * @param {Object} options - The options object
 * @param {Object} options.res - The response object
 * @param {Object} options.req - The request object
 * @param {string} options.token - The token to set
 */
export function setAuthCookie({ res, req, token }) {
  setCookie(TOKEN_NAME, token, {
    req,
    res,
    maxAge: MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'strict',
  });
}

/**
 * Gets the authentication token from cookies
 * @param {Object} options - The options object
 * @param {Object} options.res - The response object
 * @param {Object} options.req - The request object
 * @returns {string|null} - The token or null if not found
 */
export function getAuthCookie({ req, res }) {
  return getCookie(TOKEN_NAME, { req, res });
}

/**
 * Removes the authentication token from cookies
 * @param {Object} options - The options object
 * @param {Object} options.res - The response object
 * @param {Object} options.req - The request object
 */
export function removeAuthCookie({ req, res }) {
  deleteCookie(TOKEN_NAME, { req, res, path: '/' });
}

/**
 * Client-side auth utilities
 */
export const clientAuth = {
  /**
   * Sets the user in local storage
   * @param {Object} user - The user object
   */
  setUser(user) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  },
  
  /**
   * Gets the user from local storage
   * @returns {Object|null} - The user object or null if not found
   */
  getUser() {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  },
  
  /**
   * Removes the user from local storage
   */
  removeUser() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
  },
    /**
   * Logs out the user
   */
  async logout() {
    try {
      // Clear localStorage data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('userType');
        localStorage.removeItem('userId');
        
        // Clear any other cached data
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('x-ceed-') || key.includes('auth') || key.includes('user')) {
            localStorage.removeItem(key);
          }
        });
      }
      
      // Call logout API to clear server-side session
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Force page reload to clear any cached state
      window.location.href = '/auth';
    } catch (error) {
      // Even if API call fails, clear local data and redirect
      if (typeof window !== 'undefined') {
        localStorage.clear();
        window.location.href = '/auth';
      }
    }
  },
    /**
   * Checks if the user is authenticated
   * @returns {boolean} - Whether the user is authenticated
   */
  isAuthenticated() {
    return !!this.getUser();
  },
  
  /**
   * Gets the user role/type
   * @returns {string|null} - The user role ('applicant' or 'recruiter') or null if not authenticated
   */
  getUserRole() {
    const user = this.getUser();
    return user?.userType || null;
  },
  
  /**
   * Gets the authorization header for API requests
   * @returns {Object} - The headers object
   */
  getAuthHeader() {
    const user = this.getUser();
    return user?.token ? { 'Authorization': `Bearer ${user.token}` } : {};
  }
};