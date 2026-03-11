import mongoose from 'mongoose';

const passSchema = new mongoose.Schema({
  passNumber: { type: String, required: true, unique: true },
  visitor: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'active', 'expired', 'revoked'],
    default: 'pending'
  },
  qrCode: { type: String },
  purpose: { type: String },
  accessAreas: [{ type: String }],
  otpVerified: { type: Boolean, default: false },
  activatedAt: Date
}, { timestamps: true });

export default mongoose.model('Pass', passSchema);
