import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import clientPromise from './mongodb';
import { ObjectId } from 'mongodb';

export async function authMiddleware(req) {
  try {
    console.log('🔍 Auth middleware called');
    
    // Try to get the token from different sources in this order:
    // 1. Authorization header
    // 2. Cookie
    // 3. Query param (for specific cases like file downloads)
    
    let token = null;
      // Check Authorization header
    const authHeader = req.headers['authorization'] || req.headers.Authorization;
    console.log('🔍 Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
      console.log('🔍 Token extracted from header:', token ? 'YES' : 'NO');
    }
    
    // If no token in Authorization header, check cookies
    if (!token && req.cookies) {
      // Handle both Next.js App Router and API routes cookie formats
      if (typeof req.cookies.get === 'function') {
        // Next.js App Router format
        const tokenCookie = req.cookies.get('auth_token');
        if (tokenCookie) {
          token = tokenCookie.value;
        }
      } else if (req.cookies.auth_token) {
        // API routes format
        token = req.cookies.auth_token;
      }
    }
    
    // If no token in cookies, check query params (for file downloads, etc.)
    if (!token && req.query && req.query.token) {
      token = req.query.token;
    }
      if (!token) {
      console.log('❌ No token found in request');
      return {
        isAuthenticated: false,
        error: 'Authentication token is missing',
        status: 401
      };
    }    console.log('🔍 Token found, verifying...');

    // Verify the token using jose library (same as auth.js)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-for-jwt-tokens');
    let decoded;
    try {
      const { payload } = await jwtVerify(token, secret);
      decoded = payload;
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError);
      return {
        isAuthenticated: false,
        error: 'Invalid or malformed token',
        status: 401
      };
    }
    
    console.log('🔍 Token decoded:', {
      userId: decoded.userId,
      userType: decoded.userType,
      email: decoded.email
    });
    
    // Check if the token is expired
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return {
        isAuthenticated: false,
        error: 'Token has expired',
        status: 401
      };
    }    // Verify that the user still exists in the database
    if (decoded.userId) {
      const client = await clientPromise;
      const db = client.db('x-ceed-db'); // Specify the correct database name
      
      try {
        const objectId = new ObjectId(decoded.userId);
        
        const user = await db.collection('users').findOne({
          _id: objectId
        });
        
        if (!user) {
          return {
            isAuthenticated: false,
            error: 'User no longer exists',
            status: 401
          };
        }
        
        // Add the full user object without password
        const { password, ...userWithoutPassword } = user;
        
        // Add user info to the request for downstream handlers
        return {
          isAuthenticated: true,
          user: {
            ...decoded,
            details: userWithoutPassword
          },
          status: 200
        };
      } catch (objectIdError) {
        console.error('Failed to create ObjectId from userId:', objectIdError);
        return {
          isAuthenticated: false,
          error: 'Invalid user ID format',
          status: 401
        };
      }
    }
    
    // Add user info to the request for downstream handlers
    return {
      isAuthenticated: true,
      user: decoded,
      status: 200
    };
  } catch (error) {
    console.error('Auth middleware error:', error);
    return {
      isAuthenticated: false,
      error: 'Invalid or expired token',
      status: 401
    };
  }
}
