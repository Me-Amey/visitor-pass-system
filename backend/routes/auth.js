import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, department, organization } = req.body;
    
    let orgId = organization;
    
    // If no organization provided, assign to default organization
    if (!orgId) {
      let defaultOrg = await Organization.findOne();
      
      // If no organization exists, create a default one
      if (!defaultOrg) {
        defaultOrg = new Organization({
          name: 'Default Organization',
          code: 'ORG001',
          email: 'admin@organization.com',
          phone: '+91-1234567890',
          address: {
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India'
          },
          settings: {
            requireOTP: false,
            otpExpiry: 10,
            allowSelfRegistration: true,
            maxPassValidity: 24,
            workingHours: {
              start: '09:00',
              end: '18:00'
            }
          },
          subscription: {
            plan: 'free',
            maxUsers: 100,
            maxVisitorsPerMonth: 1000
          }
        });
        await defaultOrg.save();
        console.log('Created default organization:', defaultOrg.name);
      }
      
      orgId = defaultOrg._id;
    }
    
    // Check if email already exists for this organization
    const existingUser = await User.findOne({ email, organization: orgId });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered in this organization' });
    }

    const user = new User({ 
      name, 
      email, 
      password, 
      role: role || 'employee', 
      phone, 
      department,
      organization: orgId 
    });
    await user.save();
    await user.populate('organization');

    // If user is registering as a visitor, also create a Visitor record
    if (user.role === 'visitor') {
      const Visitor = (await import('../models/Visitor.js')).default;
      
      // Check if visitor already exists
      const existingVisitor = await Visitor.findOne({ email, organization: orgId });
      
      if (!existingVisitor) {
        const visitor = new Visitor({
          name: user.name,
          email: user.email,
          phone: user.phone || 'N/A',
          idType: 'national_id',
          idNumber: 'SELF-REGISTERED',
          organization: orgId,
          company: 'Self-Registered'
        });
        await visitor.save();
        console.log('Created visitor record for:', user.email);
      }
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, organizationId } = req.body;
    
    // Build query
    const query = { email };
    if (organizationId) {
      query.organization = organizationId;
    }
    
    const user = await User.findOne(query).populate('organization');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    // Auto-fix: If user has no organization, assign to default
    if (!req.user.organization) {
      console.log('User has no organization, auto-assigning...');
      
      let defaultOrg = await Organization.findOne();
      
      if (!defaultOrg) {
        defaultOrg = new Organization({
          name: 'Default Organization',
          code: 'ORG001',
          email: 'admin@organization.com',
          phone: '+91-1234567890',
          address: {
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India'
          },
          settings: {
            requireOTP: false,
            otpExpiry: 10,
            allowSelfRegistration: true,
            maxPassValidity: 24,
            workingHours: {
              start: '09:00',
              end: '18:00'
            }
          },
          subscription: {
            plan: 'free',
            maxUsers: 100,
            maxVisitorsPerMonth: 1000
          }
        });
        await defaultOrg.save();
        console.log('Created default organization');
      }
      
      req.user.organization = defaultOrg._id;
      await req.user.save();
      await req.user.populate('organization');
      console.log('User assigned to organization:', defaultOrg.name);
    }
    
    res.json({
      user: {
        _id: req.user._id,
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        organization: req.user.organization,
        permissions: req.user.permissions
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
