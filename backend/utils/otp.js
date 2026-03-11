import OTP from '../models/OTP.js';
import { sendEmail } from './email.js';
import crypto from 'crypto';

// Generate random 6-digit OTP
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Create and save OTP
export const createOTP = async (email, phone, purpose, referenceId, organization, expiryMinutes = 10) => {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  // Delete any existing OTPs for this email and purpose
  await OTP.deleteMany({ email, purpose, verified: false });

  const otpDoc = new OTP({
    email,
    phone,
    otp,
    purpose,
    referenceId,
    organization,
    expiresAt
  });

  await otpDoc.save();
  return otp;
};

// Send OTP via email
export const sendOTPEmail = async (email, otp, purpose, organizationName) => {
  const purposeText = {
    'visitor_verification': 'Visitor Verification',
    'pass_activation': 'Pass Activation',
    'appointment_confirmation': 'Appointment Confirmation',
    'check_in': 'Check-In Verification'
  };

  const subject = `${purposeText[purpose]} - OTP Code`;
  const text = `
Hello,

Your OTP code for ${purposeText[purpose]} at ${organizationName} is:

${otp}

This code will expire in 10 minutes.

If you did not request this code, please ignore this email.

Best regards,
${organizationName} Security Team
  `;

  // Log OTP to console for development/testing
  console.log('\n=== OTP EMAIL ===');
  console.log('To:', email);
  console.log('Purpose:', purposeText[purpose]);
  console.log('OTP CODE:', otp);
  console.log('=================\n');

  try {
    await sendEmail(email, subject, text);
    console.log('✓ Email sent successfully to:', email);
  } catch (error) {
    console.error('✗ Email sending failed:', error.message);
    console.log('⚠ OTP is still valid, check console for OTP code above');
  }
};

// Verify OTP
export const verifyOTP = async (email, otp, purpose, referenceId = null) => {
  const query = { email, otp, purpose, verified: false };
  if (referenceId) {
    query.referenceId = referenceId;
  }

  const otpDoc = await OTP.findOne(query);

  if (!otpDoc) {
    return { success: false, message: 'Invalid OTP code' };
  }

  if (!otpDoc.isValid()) {
    if (otpDoc.attempts >= otpDoc.maxAttempts) {
      return { success: false, message: 'Maximum attempts exceeded. Please request a new OTP.' };
    }
    if (new Date() >= otpDoc.expiresAt) {
      return { success: false, message: 'OTP has expired. Please request a new one.' };
    }
  }

  // Increment attempts
  otpDoc.attempts += 1;

  if (otpDoc.otp !== otp) {
    await otpDoc.save();
    return { 
      success: false, 
      message: `Invalid OTP. ${otpDoc.maxAttempts - otpDoc.attempts} attempts remaining.` 
    };
  }

  // Mark as verified
  otpDoc.verified = true;
  await otpDoc.save();

  return { success: true, message: 'OTP verified successfully', otpDoc };
};

// Resend OTP
export const resendOTP = async (email, purpose, referenceId, organization, organizationName) => {
  const otp = await createOTP(email, null, purpose, referenceId, organization);
  await sendOTPEmail(email, otp, purpose, organizationName);
  return otp;
};

// Clean up expired OTPs (can be run as a cron job)
export const cleanupExpiredOTPs = async () => {
  const result = await OTP.deleteMany({ expiresAt: { $lt: new Date() } });
  console.log(`Cleaned up ${result.deletedCount} expired OTPs`);
  return result.deletedCount;
};
