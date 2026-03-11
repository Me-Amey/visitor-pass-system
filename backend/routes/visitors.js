import express from 'express';
import multer from 'multer';
import Visitor from '../models/Visitor.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for photo uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

router.post('/', authenticate, upload.single('photo'), async (req, res) => {
  try {
    // Debug: Log what we're receiving
    console.log('=== VISITOR CREATION DEBUG ===');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request body:', req.body);
    console.log('Request file:', req.file ? `File: ${req.file.originalname}` : 'No file');
    console.log('User org:', req.user.organization);
    
    // Validate required fields
    if (!req.body.name || !req.body.email || !req.body.phone || !req.body.idType || !req.body.idNumber) {
      console.log('Missing required fields!');
      return res.status(400).json({ 
        message: 'Missing required fields',
        received: {
          name: !!req.body.name,
          email: !!req.body.email,
          phone: !!req.body.phone,
          idType: !!req.body.idType,
          idNumber: !!req.body.idNumber
        }
      });
    }
    
    // Get organization ID consistently
    const organizationId = req.user.organization?._id || req.user.organization;
    
    // When using multer, text fields are in req.body
    const visitorData = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      idType: req.body.idType,
      idNumber: req.body.idNumber,
      company: req.body.company || '',
      address: req.body.address || '',
      organization: organizationId
    };

    // Convert photo to base64 if uploaded
    if (req.file) {
      const base64Photo = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      visitorData.photo = base64Photo;
    }

    console.log('Creating visitor with organization:', organizationId);

    const visitor = new Visitor(visitorData);
    await visitor.save();
    
    console.log('Visitor created successfully:', visitor._id, 'with org:', visitor.organization);
    res.status(201).json(visitor);
  } catch (error) {
    console.error('Visitor creation error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const { search } = req.query;
    
    console.log('=== VISITOR LIST DEBUG ===');
    console.log('User role:', req.user.role);
    console.log('User organization:', req.user.organization);
    
    // Build query with organization filter
    const query = {};
    
    // Filter by organization (except super_admin)
    if (req.user.role !== 'super_admin') {
      const orgId = req.user.organization?._id || req.user.organization;
      query.organization = orgId;
      console.log('Filtering by organization:', orgId);
    } else {
      console.log('Super admin - no org filter');
    }
    
    // Add search filter
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') }
      ];
    }
    
    console.log('Query:', JSON.stringify(query));
    
    const visitors = await Visitor.find(query)
      .populate('organization', 'name code')
      .sort({ createdAt: -1 });
    
    console.log('Found visitors:', visitors.length);
    if (visitors.length > 0) {
      console.log('First visitor org:', visitors[0].organization);
    }
    
    res.json(visitors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id)
      .populate('organization', 'name code');
    
    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    // Check organization access
    if (req.user.role !== 'super_admin' && 
        visitor.organization && 
        visitor.organization._id.toString() !== req.user.organization._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(visitor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    
    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    // Check organization access
    if (req.user.role !== 'super_admin' && 
        visitor.organization && 
        visitor.organization.toString() !== req.user.organization._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    Object.assign(visitor, req.body);
    await visitor.save();
    res.json(visitor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    
    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    // Check organization access
    if (req.user.role !== 'super_admin' && 
        visitor.organization && 
        visitor.organization.toString() !== req.user.organization._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await visitor.deleteOne();
    res.json({ message: 'Visitor deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
