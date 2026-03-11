import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password').populate('organization');
    
    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

// Middleware to check if user belongs to the same organization
export const checkOrganization = async (req, res, next) => {
  try {
    // Super admin can access all organizations
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Get organization ID from request (body, params, or query)
    const orgId = req.body.organization || req.params.organizationId || req.query.organizationId;

    if (!orgId) {
      return res.status(400).json({ message: 'Organization ID required' });
    }

    // Check if user belongs to the organization
    if (req.user.organization._id.toString() !== orgId.toString()) {
      return res.status(403).json({ message: 'Access denied to this organization' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Middleware to check specific permissions
export const checkPermission = (...permissions) => {
  return (req, res, next) => {
    // Super admin has all permissions
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Check if user has any of the required permissions
    const hasPermission = permissions.some(permission => 
      req.user.permissions?.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};
