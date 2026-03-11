import express from 'express';
import Organization from '../models/Organization.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Create organization (super admin only)
router.post('/', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const organization = new Organization(req.body);
    await organization.save();
    res.status(201).json(organization);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all organizations (super admin only)
router.get('/', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const organizations = await Organization.find().sort({ createdAt: -1 });
    res.json(organizations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single organization
router.get('/:id', authenticate, async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    res.json(organization);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user's organization
router.get('/my/organization', authenticate, async (req, res) => {
  try {
    if (!req.user.organization) {
      return res.status(404).json({ message: 'No organization assigned' });
    }
    const organization = await Organization.findById(req.user.organization);
    res.json(organization);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update organization
router.put('/:id', authenticate, authorize('super_admin', 'org_admin'), async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);
    
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // If org_admin, verify they belong to this organization
    if (req.user.role === 'org_admin' && req.user.organization.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    Object.assign(organization, req.body);
    await organization.save();
    res.json(organization);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete organization (super admin only)
router.delete('/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const organization = await Organization.findByIdAndDelete(req.params.id);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    res.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get organization statistics
router.get('/:id/stats', authenticate, async (req, res) => {
  try {
    const Pass = (await import('../models/Pass.js')).default;
    const User = (await import('../models/User.js')).default;
    const Visitor = (await import('../models/Visitor.js')).default;
    const CheckLog = (await import('../models/CheckLog.js')).default;

    const orgId = req.params.id;

    // Verify access
    if (req.user.role !== 'super_admin' && req.user.organization.toString() !== orgId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [totalUsers, totalVisitors, activePasses, todayCheckIns] = await Promise.all([
      User.countDocuments({ organization: orgId, isActive: true }),
      Visitor.countDocuments({ organization: orgId }),
      Pass.countDocuments({ organization: orgId, status: 'active' }),
      CheckLog.countDocuments({
        organization: orgId,
        type: 'check-in',
        timestamp: { $gte: new Date().setHours(0, 0, 0, 0) }
      })
    ]);

    res.json({
      totalUsers,
      totalVisitors,
      activePasses,
      todayCheckIns
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
