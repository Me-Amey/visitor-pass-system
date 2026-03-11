// SMS Notification Utility
// This is a placeholder for SMS functionality
// Integrate with services like Twilio, AWS SNS, or Indian SMS providers like MSG91, TextLocal

/**
 * Send SMS notification
 * @param {string} phone - Phone number with country code (e.g., +91XXXXXXXXXX)
 * @param {string} message - SMS message content
 * @returns {Promise<boolean>} - Success status
 */
export const sendSMS = async (phone, message) => {
  try {
    console.log('📱 SMS Notification:');
    console.log(`To: ${phone}`);
    console.log(`Message: ${message}`);
    
    // TODO: Integrate with SMS provider
    // Example with Twilio:
    // const client = require('twilio')(accountSid, authToken);
    // await client.messages.create({
    //   body: message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phone
    // });

    // Example with MSG91 (Indian SMS provider):
    // const axios = require('axios');
    // await axios.get('https://api.msg91.com/api/v5/flow/', {
    //   params: {
    //     authkey: process.env.MSG91_AUTH_KEY,
    //     mobiles: phone,
    //     message: message
    //   }
    // });

    // For now, just log the SMS
    console.log('✅ SMS would be sent in production');
    return true;
  } catch (error) {
    console.error('❌ SMS sending failed:', error.message);
    return false;
  }
};

/**
 * Send OTP via SMS
 * @param {string} phone - Phone number
 * @param {string} otp - OTP code
 * @param {string} organizationName - Organization name
 * @returns {Promise<boolean>} - Success status
 */
export const sendOTPSMS = async (phone, otp, organizationName) => {
  const message = `Your OTP for ${organizationName} is: ${otp}. Valid for 10 minutes. Do not share this code.`;
  return await sendSMS(phone, message);
};

/**
 * Send pass activation SMS
 * @param {string} phone - Phone number
 * @param {string} passNumber - Pass number
 * @param {string} organizationName - Organization name
 * @returns {Promise<boolean>} - Success status
 */
export const sendPassActivationSMS = async (phone, passNumber, organizationName) => {
  const message = `Your visitor pass ${passNumber} for ${organizationName} has been activated. Please check your email for details.`;
  return await sendSMS(phone, message);
};

/**
 * Send appointment confirmation SMS
 * @param {string} phone - Phone number
 * @param {string} date - Appointment date
 * @param {string} time - Appointment time
 * @param {string} organizationName - Organization name
 * @returns {Promise<boolean>} - Success status
 */
export const sendAppointmentSMS = async (phone, date, time, organizationName) => {
  const message = `Your appointment at ${organizationName} is confirmed for ${date} at ${time}. Please arrive 10 minutes early.`;
  return await sendSMS(phone, message);
};

/**
 * Send check-in confirmation SMS
 * @param {string} phone - Phone number
 * @param {string} visitorName - Visitor name
 * @param {string} organizationName - Organization name
 * @returns {Promise<boolean>} - Success status
 */
export const sendCheckInSMS = async (phone, visitorName, organizationName) => {
  const message = `${visitorName} has checked in at ${organizationName}. Thank you for visiting!`;
  return await sendSMS(phone, message);
};

// Configuration guide for popular SMS providers in India:

/*
1. MSG91 (Popular in India)
   - Sign up at https://msg91.com/
   - Get AUTH_KEY from dashboard
   - Add to .env: MSG91_AUTH_KEY=your_auth_key
   - Pricing: ₹0.15 - ₹0.25 per SMS

2. TextLocal (India)
   - Sign up at https://www.textlocal.in/
   - Get API key
   - Add to .env: TEXTLOCAL_API_KEY=your_api_key
   - Pricing: ₹0.10 - ₹0.20 per SMS

3. Twilio (International)
   - Sign up at https://www.twilio.com/
   - Get Account SID and Auth Token
   - Add to .env:
     TWILIO_ACCOUNT_SID=your_account_sid
     TWILIO_AUTH_TOKEN=your_auth_token
     TWILIO_PHONE_NUMBER=your_twilio_number
   - Pricing: ₹0.50 - ₹1.00 per SMS

4. AWS SNS (Amazon)
   - Set up AWS account
   - Configure SNS service
   - Add AWS credentials to .env
   - Pricing: ₹0.50 per SMS

Recommended for India: MSG91 or TextLocal (better pricing and local support)
*/

export default {
  sendSMS,
  sendOTPSMS,
  sendPassActivationSMS,
  sendAppointmentSMS,
  sendCheckInSMS
};
