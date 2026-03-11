import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['super_admin', 'org_admin', 'security', 'employee', 'visitor'],
    default: 'visitor'
  },
  phone: String,
  department: String,
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  isActive: { type: Boolean, default: true },
  permissions: [{
    type: String,
    enum: ['manage_users', 'manage_visitors', 'manage_passes', 'manage_appointments', 'view_reports', 'manage_settings']
  }]
}, { timestamps: true });

// Compound index for email uniqueness within organization
userSchema.index({ email: 1, organization: 1 }, { unique: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model('User', userSchema);
