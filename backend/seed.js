import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from './models/User.js';
import Visitor from './models/Visitor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

console.log('Environment check:');
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('MONGODB_URI value:', process.env.MONGODB_URI?.substring(0, 30) + '...');

const seedData = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('.env file not loaded or MONGODB_URI not set');
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Visitor.deleteMany({});

    // Create users
    const users = await User.create([
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        phone: '1234567890'
      },
      {
        name: 'Security Guard',
        email: 'security@example.com',
        password: 'security123',
        role: 'security',
        phone: '1234567891'
      },
      {
        name: 'John Employee',
        email: 'john@example.com',
        password: 'employee123',
        role: 'employee',
        phone: '1234567892',
        department: 'IT'
      }
    ]);

    // Create sample visitors
    await Visitor.create([
      {
        name: 'Jane Visitor',
        email: 'jane@example.com',
        phone: '9876543210',
        idType: 'license',
        idNumber: 'DL123456',
        company: 'ABC Corp'
      },
      {
        name: 'Bob Client',
        email: 'bob@example.com',
        phone: '9876543211',
        idType: 'passport',
        idNumber: 'PP987654',
        company: 'XYZ Ltd'
      }
    ]);

    console.log('Demo data seeded successfully');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@example.com / admin123');
    console.log('Security: security@example.com / security123');
    console.log('Employee: john@example.com / employee123');
    
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
