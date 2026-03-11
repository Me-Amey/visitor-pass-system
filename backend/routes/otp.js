import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { createOTP, sendOTPEmail, verifyOTP, resendOTP } from '../utils/otp.js';
import Organization from '../models/Organization.js';
import Pass from '../models/Pass.js';
import Appointment from '../models/Appointment.js';

const router = express.Router();

// Request OTP for pass activation
router.post('/request/pass-activation', authenticate, async (req, res) => {
  try {
    const { passId, email } = req.body;

    const pass = await Pass.findById(passId).populate('organization');
    if (!pass) {
      return res.status(404).json({ message: 'Pass not found' });
    }

    const organization = pass.organization;
    if (!organization.settings.requireOTP) {
      return res.status(400).json({ message: 'OTP not required for this organization' });
    }

    const otp = await createOTP(
      email,
      null,
      'pass_activation',
      passId,
      organization._id,
      organization.settings.otpExpiry
    );

    await sendOTPEmail(email, otp, 'pass_activation', organization.name);

    res.json({ 
      message: 'OTP sent successfully',
      expiresIn: organization.settings.otpExpiry 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Request OTP for visitor verification
router.post('/request/visitor-verification', async (req, res) => {
  try {
    const { email, organizationId } = req.body;

    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const otp = await createOTP(
      email,
      null,
      'visitor_verification',
      null,
      organization._id,
      organization.settings.otpExpiry
    );

    await sendOTPEmail(email, otp, 'visitor_verification', organization.name);

    res.json({ 
      message: 'OTP sent successfully',
      expiresIn: organization.settings.otpExpiry 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Request OTP for appointment confirmation
router.post('/request/appointment-confirmation', authenticate, async (req, res) => {
  try {
    const { appointmentId, email } = req.body;

    const appointment = await Appointment.findById(appointmentId).populate('organization');
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const organization = appointment.organization;

    const otp = await createOTP(
      email,
      null,
      'appointment_confirmation',
      appointmentId,
      organization._id,
      organization.settings.otpExpiry
    );

    await sendOTPEmail(email, otp, 'appointment_confirmation', organization.name);

    res.json({ 
      message: 'OTP sent successfully',
      expiresIn: organization.settings.otpExpiry 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Request OTP for check-in
router.post('/request/check-in', authenticate, async (req, res) => {
  try {
    const { passId, email } = req.body;

    const pass = await Pass.findById(passId).populate('organization');
    if (!pass) {
      return res.status(404).json({ message: 'Pass not found' });
    }

    const organization = pass.organization;

    const otp = await createOTP(
      email,
      null,
      'check_in',
      passId,
      organization._id,
      organization.settings.otpExpiry
    );

    await sendOTPEmail(email, otp, 'check_in', organization.name);

    res.json({ 
      message: 'OTP sent successfully',
      expiresIn: organization.settings.otpExpiry 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify OTP
router.post('/verify', async (req, res) => {
  try {
    const { email, otp, purpose, referenceId } = req.body;

    const result = await verifyOTP(email, otp, purpose, referenceId);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    // Update related document based on purpose
    if (purpose === 'pass_activation' && referenceId) {
      await Pass.findByIdAndUpdate(referenceId, {
        otpVerified: true,
        status: 'active',
        activatedAt: new Date()
      });
    } else if (purpose === 'appointment_confirmation' && referenceId) {
      await Appointment.findByIdAndUpdate(referenceId, {
        otpVerified: true
      });
    }

    res.json({ 
      message: result.message,
      verified: true 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Resend OTP
router.post('/resend', async (req, res) => {
  try {
    const { email, purpose, referenceId, organizationId } = req.body;

    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    await resendOTP(email, purpose, referenceId, organization._id, organization.name);

    res.json({ 
      message: 'OTP resent successfully',
      expiresIn: organization.settings.otpExpiry 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
