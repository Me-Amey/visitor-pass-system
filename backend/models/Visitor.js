import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  idType: { type: String, enum: ['passport', 'license', 'national_id'], required: true },
  idNumber: { type: String, required: true },
  photo: String,
  company: String,
  address: String,
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  isBlacklisted: { type: Boolean, default: false },
  blacklistReason: String,
  visitHistory: [{
    date: Date,
    purpose: String,
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
}, { timestamps: true });

export default mongoose.model('Visitor', visitorSchema);
