import express from 'express';
import CheckLog from '../models/CheckLog.js';
import Pass from '../models/Pass.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, authorize('org_admin', 'security'), async (req, res) => {
  try {
    const { passId, type, location, notes, scanMethod, temperature } = req.body;
    
    const pass = await Pass.findById(passId).populate(['visitor', 'organization']);
    if (!pass) {
      return res.status(404).json({ message: 'Pass not found' });
    }

    // Check organization access
    if (req.user.role !== 'super_admin' && 
        pass.organization._id.toString() !== req.user.organization._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Verify pass is still valid
    const now = new Date();
    if (pass.status !== 'active' || now < pass.validFrom || now > pass.validUntil) {
      return res.status(400).json({ message: 'Pass is not valid' });
    }
    
    const checkLog = new CheckLog({
      pass: passId,
      visitor: pass.visitor._id,
      organization: pass.organization._id,
      type,
      verifiedBy: req.user._id,
      location,
      notes,
      scanMethod: scanMethod || 'manual',
      temperature
    });
    
    await checkLog.save();
    await checkLog.populate(['pass', 'visitor', 'verifiedBy', 'organization']);
    
    res.status(201).json(checkLog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    console.log('GET /checklogs - User:', req.user.email, 'Role:', req.user.role);
    
    const { startDate, endDate, type } = req.query;
    let query = {};
    
    // Filter by organization (except super_admin)
    if (req.user.role !== 'super_admin') {
      const orgId = req.user.organization?._id || req.user.organization;
      if (orgId) {
        query.organization = orgId;
        console.log('Filtering checklogs by organization:', orgId);
      } else {
        console.log('Warning: User has no organization, returning empty result');
        return res.json([]);
      }
    }
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    if (type) query.type = type;
    
    const logs = await CheckLog.find(query)
      .populate(['pass', 'visitor', 'verifiedBy', 'organization'])
      .sort({ timestamp: -1 })
      .limit(100);
    
    console.log('Found checklogs:', logs.length);
    res.json(logs);
  } catch (error) {
    console.error('GET /checklogs error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
