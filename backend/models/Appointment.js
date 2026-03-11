import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  visitor: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor', required: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  purpose: { type: String, required: true },
  scheduledDate: { type: Date, required: true },
  scheduledTime: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  notes: String,
  otpVerified: { type: Boolean, default: false },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date
}, { timestamps: true });

export default mongoose.model('Appointment', appointmentSchema);
