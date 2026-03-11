import express from 'express';
import Appointment from '../models/Appointment.js';
import { authenticate } from '../middleware/auth.js';
import { sendEmail } from '../utils/email.js';

const router = express.Router();

router.post('/', authenticate, async (req, res) => {
  try {
    console.log('=== APPOINTMENT CREATION DEBUG ===');
    console.log('User:', req.user.email);
    console.log('User organization:', req.user.organization);
    console.log('Request body:', req.body);
    
    let organizationId = req.user.organization?._id || req.user.organization;
    
    // Auto-fix: If user has no organization, assign to default
    if (!organizationId) {
      console.log('User has no organization, auto-assigning...');
      
      const Organization = (await import('../models/Organization.js')).default;
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
            requireOTP: false, // Disabled by default for easier testing
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
    
    const appointmentData = {
      ...req.body,
      organization: organizationId
    };
    
    console.log('Creating appointment with data:', appointmentData);
    
    const appointment = new Appointment(appointmentData);
    await appointment.save();
    await appointment.populate(['visitor', 'host', 'organization']);
    
    console.log('Appointment created:', appointment._id);
    
    // Send notification email
    try {
      if (appointment.visitor && appointment.visitor.email) {
        await sendEmail(
          appointment.visitor.email,
          'Appointment Request Submitted',
          `Your appointment request for ${appointment.scheduledDate.toDateString()} at ${appointment.organization.name} has been submitted.`
        );
        console.log('Email sent to:', appointment.visitor.email);
      }
    } catch (emailError) {
      console.error('Email notification failed:', emailError.message);
    }
    
    res.status(201).json(appointment);
  } catch (error) {
    console.error('Appointment creation error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const query = {};
    
    // Filter by organization (except super_admin)
    if (req.user.role !== 'super_admin') {
      const orgId = req.user.organization?._id || req.user.organization;
      if (orgId) {
        query.organization = orgId;
      }
    }
    
    // Filter by host for employees
    if (req.user.role === 'employee') {
      query.host = req.user._id;
    }
    
    const appointments = await Appointment.find(query)
      .populate(['visitor', 'host', 'organization', 'approvedBy'])
      .sort({ scheduledDate: -1 });
    res.json(appointments);
  } catch (error) {
    console.error('Appointments fetch error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate(['visitor', 'host', 'organization', 'approvedBy']);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check organization access
    if (req.user.role !== 'super_admin' && 
        appointment.organization._id.toString() !== req.user.organization._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check organization access
    if (req.user.role !== 'super_admin' && 
        appointment.organization.toString() !== req.user.organization._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    appointment.status = status;
    if (status === 'approved') {
      appointment.approvedBy = req.user._id;
      appointment.approvedAt = new Date();
    }
    await appointment.save();
    await appointment.populate(['visitor', 'host', 'organization', 'approvedBy']);
    
    // Send notification
    try {
      await sendEmail(
        appointment.visitor.email,
        `Appointment ${status}`,
        `Your appointment at ${appointment.organization.name} has been ${status}.`
      );
    } catch (emailError) {
      console.error('Email notification failed:', emailError.message);
    }
    
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check organization access
    if (req.user.role !== 'super_admin' && 
        appointment.organization.toString() !== req.user.organization._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    Object.assign(appointment, req.body);
    await appointment.save();
    await appointment.populate(['visitor', 'host', 'organization', 'approvedBy']);
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check organization access
    if (req.user.role !== 'super_admin' && 
        appointment.organization.toString() !== req.user.organization._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await appointment.deleteOne();
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
