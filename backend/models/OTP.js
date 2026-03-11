import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  phone: { type: String },
  otp: { type: String, required: true },
  purpose: { 
    type: String, 
    enum: ['visitor_verification', 'pass_activation', 'appointment_confirmation', 'check_in'],
    required: true 
  },
  referenceId: { type: String }, // Pass ID, Appointment ID, etc.
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  expiresAt: { type: Date, required: true },
  verified: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 3 }
}, { timestamps: true });

// Index for automatic deletion of expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to check if OTP is valid
otpSchema.methods.isValid = function() {
  return !this.verified && 
         this.attempts < this.maxAttempts && 
         new Date() < this.expiresAt;
};

export default mongoose.model('OTP', otpSchema);
