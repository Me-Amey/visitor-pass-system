import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true }, // Short code like 'ORG001'
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  logo: String,
  website: String,
  settings: {
    requireOTP: { type: Boolean, default: true },
    otpExpiry: { type: Number, default: 10 }, // minutes
    allowSelfRegistration: { type: Boolean, default: false },
    maxPassValidity: { type: Number, default: 24 }, // hours
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '18:00' }
    },
    allowedAccessAreas: [{ type: String }]
  },
  isActive: { type: Boolean, default: true },
  subscription: {
    plan: { type: String, enum: ['free', 'basic', 'premium', 'enterprise'], default: 'free' },
    startDate: Date,
    endDate: Date,
    maxUsers: { type: Number, default: 10 },
    maxVisitorsPerMonth: { type: Number, default: 100 }
  }
}, { timestamps: true });

export default mongoose.model('Organization', organizationSchema);
