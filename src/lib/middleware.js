import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import clientPromise from './mongodb';
import { ObjectId } from 'mongodb';

export async function authMiddleware(req) {
  try {
    // Try to get the token from different sources in this order:
    // 1. Authorization header
    // 2. Cookie
    // 3. Query param (for specific cases like file downloads)
    
    let token = null;
    
    // Check Authorization header
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    
    // If no token in Authorization header, check cookies
    if (!token && req.cookies) {
      const tokenCookie = req.cookies.get('auth_token');
      if (tokenCookie) {
        token = tokenCookie.value;
      }
    }
    
    // If no token in cookies, check query params (for file downloads, etc.)
    if (!token && req.query && req.query.token) {
      token = req.query.token;
    }
    
    if (!token) {
      return {
        isAuthenticated: false,
        error: 'Authentication token is missing',
        status: 401
      };
    }
    
    // Verify the token
    const decoded = verify(token, process.env.JWT_SECRET);
    
    // Check if the token is expired
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return {
        isAuthenticated: false,
        error: 'Token has expired',
        status: 401
      };
    }
    
    // Verify that the user still exists in the database
    if (decoded.userId) {
      const client = await clientPromise;
      const db = client.db();
      
      const user = await db.collection('users').findOne({
        _id: new ObjectId(decoded.userId)
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
