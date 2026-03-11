import express from 'express';
import Pass from '../models/Pass.js';
import { authenticate, authorize, checkOrganization } from '../middleware/auth.js';
import { generatePassPDF, generateQRCode } from '../utils/pdf.js';
import { createOTP, sendOTPEmail } from '../utils/otp.js';
import Organization from '../models/Organization.js';

const router = express.Router();

router.post('/', authenticate, authorize('org_admin', 'security'), async (req, res) => {
  try {
    const { visitor, appointment, host, validFrom, validUntil, purpose, accessAreas } = req.body;
    
    console.log('=== PASS CREATION DEBUG ===');
    console.log('User:', req.user.email);
    console.log('User role:', req.user.role);
    console.log('User organization:', req.user.organization);
    
    const passNumber = `VP${Date.now()}`;
    
    // Get organization ID
    let organizationId = req.user.organization?._id || req.user.organization;
    
    // Auto-fix: If user has no organization, assign to default
    if (!organizationId) {
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
      
      const User = (await import('../models/User.js')).default;
      await User.findByIdAndUpdate(req.user._id, { organization: defaultOrg._id });
      organizationId = defaultOrg._id;
      console.log('User assigned to organization:', defaultOrg.name);
    }
    
    console.log('Organization ID:', organizationId);
    
    // Fetch full organization details with settings
    const organization = await Organization.findById(organizationId);
    
    console.log('Organization found:', organization ? organization.name : 'NOT FOUND');
    
    if (!organization) {
      return res.status(404).json({ 
        message: 'Organization not found. Please contact administrator to set up your organization.' 
      });
    }

    // Check if OTP is required
    const requireOTP = organization.settings?.requireOTP || false;
    
    console.log('Require OTP:', requireOTP);
    
    // Generate QR code with pass data
    const qrData = JSON.stringify({
      passNumber,
      visitor,
      validFrom,
      validUntil,
      organization: organization._id,
      timestamp: Date.now()
    });
    const qrCode = await generateQRCode(qrData);
    
    const pass = new Pass({
      passNumber,
      visitor,
      appointment,
      host,
      organization: organization._id,
      issuedBy: req.user._id,
      validFrom,
      validUntil,
      qrCode,
      purpose,
      accessAreas,
      status: requireOTP ? 'pending' : 'active',
      otpVerified: !requireOTP
    });
    
    await pass.save();
    await pass.populate(['visitor', 'host', 'issuedBy', 'organization']);

    // Send OTP if required
    if (requireOTP) {
      const otp = await createOTP(
        pass.visitor.email,
        pass.visitor.phone,
        'pass_activation',
        pass._id,
        organization._id,
        organization.settings?.otpExpiry || 10
      );
      await sendOTPEmail(pass.visitor.email, otp, 'pass_activation', organization.name);
    }
    
    console.log('Pass created successfully:', passNumber);
    
    res.status(201).json({
      pass,
      requireOTP,
      message: requireOTP ? 'Pass created. OTP sent to visitor email.' : 'Pass created and activated.'
    });
  } catch (error) {
    console.error('Pass creation error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    console.log('GET /passes - User:', req.user.email, 'Role:', req.user.role);
    console.log('User organization:', req.user.organization);
    
    let query = {};
    
    if (req.user.role !== 'super_admin') {
      const orgId = req.user.organization?._id || req.user.organization;
      if (orgId) {
        query.organization = orgId;
        console.log('Filtering passes by organization:', orgId);
      } else {
        console.log('Warning: User has no organization, returning empty result');
        return res.json([]);
      }
    }

    const passes = await Pass.find(query)
      .populate(['visitor', 'host', 'issuedBy', 'organization'])
      .sort({ createdAt: -1 });
    
    console.log('Found passes:', passes.length);
    res.json(passes);
  } catch (error) {
    console.error('GET /passes error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const pass = await Pass.findById(req.params.id)
      .populate(['visitor', 'host', 'issuedBy', 'organization']);
    
    if (!pass) {
      return res.status(404).json({ message: 'Pass not found' });
    }

    // Check organization access
    if (req.user.role !== 'super_admin' && 
        pass.organization._id.toString() !== req.user.organization._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(pass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id/pdf', authenticate, async (req, res) => {
  try {
    const pass = await Pass.findById(req.params.id)
      .populate(['visitor', 'host', 'issuedBy', 'organization']);
    
    if (!pass) {
      return res.status(404).json({ message: 'Pass not found' });
    }

    // Check organization access
    if (req.user.role !== 'super_admin' && 
        pass.organization._id.toString() !== req.user.organization._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const pdfBuffer = await generatePassPDF(pass);
    res.contentType('application/pdf');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/verify', authenticate, async (req, res) => {
  try {
    const { passNumber, qrData } = req.body;
    
    let searchNumber = passNumber;
    
    // If QR data is provided, extract pass number
    if (qrData) {
      try {
        const parsed = JSON.parse(qrData);
        searchNumber = parsed.passNumber;
      } catch (e) {
        searchNumber = qrData;
      }
    }
    
    const pass = await Pass.findOne({ passNumber: searchNumber })
      .populate(['visitor', 'host', 'organization']);
    
    if (!pass) {
      return res.status(404).json({ valid: false, message: 'Pass not found' });
    }

    // Check organization access
    if (req.user.role !== 'super_admin' && 
        pass.organization._id.toString() !== req.user.organization._id.toString()) {
      return res.status(403).json({ valid: false, message: 'Pass belongs to different organization' });
    }
    
    const now = new Date();
    const isActive = pass.status === 'active';
    const isOTPVerified = !pass.organization.settings?.requireOTP || pass.otpVerified;
    const isWithinValidity = now >= pass.validFrom && now <= pass.validUntil;
    
    const isValid = isActive && isOTPVerified && isWithinValidity;
    
    let message = 'Pass is valid';
    if (!isActive) message = 'Pass is not active';
    else if (!isOTPVerified) message = 'Pass requires OTP verification';
    else if (!isWithinValidity) message = 'Pass is expired or not yet valid';
    
    res.json({ 
      valid: isValid, 
      pass,
      message
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/scan-qr', authenticate, async (req, res) => {
  try {
    const { qrData } = req.body;
    
    const parsed = JSON.parse(qrData);
    const pass = await Pass.findOne({ passNumber: parsed.passNumber })
      .populate(['visitor', 'host', 'organization']);
    
    if (!pass) {
      return res.status(404).json({ valid: false, message: 'Pass not found' });
    }

    // Check organization access
    if (req.user.role !== 'super_admin' && 
        pass.organization._id.toString() !== req.user.organization._id.toString()) {
      return res.status(403).json({ valid: false, message: 'Pass belongs to different organization' });
    }
    
    const now = new Date();
    const isActive = pass.status === 'active';
    const isOTPVerified = !pass.organization.settings?.requireOTP || pass.otpVerified;
    const isWithinValidity = now >= pass.validFrom && now <= pass.validUntil;
    
    const isValid = isActive && isOTPVerified && isWithinValidity;
    
    let message = 'QR scan successful';
    if (!isActive) message = 'Pass is not active';
    else if (!isOTPVerified) message = 'Pass requires OTP verification';
    else if (!isWithinValidity) message = 'Pass is expired or not yet valid';
    
    res.json({ 
      valid: isValid, 
      pass,
      scanMethod: 'qr',
      message
    });
  } catch (error) {
    res.status(500).json({ valid: false, message: 'Invalid QR code' });
  }
});

// Activate pass with OTP
router.post('/:id/activate', authenticate, async (req, res) => {
  try {
    const pass = await Pass.findById(req.params.id).populate('organization');
    
    if (!pass) {
      return res.status(404).json({ message: 'Pass not found' });
    }

    if (pass.status === 'active') {
      return res.status(400).json({ message: 'Pass is already active' });
    }

    if (!pass.otpVerified) {
      return res.status(400).json({ message: 'OTP verification required' });
    }

    pass.status = 'active';
    pass.activatedAt = new Date();
    await pass.save();

    res.json({ message: 'Pass activated successfully', pass });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
