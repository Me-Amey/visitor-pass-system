import mongoose from 'mongoose';

const checkLogSchema = new mongoose.Schema({
  pass: { type: mongoose.Schema.Types.ObjectId, ref: 'Pass', required: true },
  visitor: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor', required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  type: { type: String, enum: ['check-in', 'check-out'], required: true },
  timestamp: { type: Date, default: Date.now },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: String,
  notes: String,
  scanMethod: { type: String, enum: ['qr', 'manual', 'otp'], default: 'manual' },
  temperature: Number,
  photoUrl: String
}, { timestamps: true });

export default mongoose.model('CheckLog', checkLogSchema);
