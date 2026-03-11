import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import Organization from './models/Organization.js';
import User from './models/User.js';

dotenv.config();

const setupDefaultOrganization = async () => {
  try {
    await connectDB();
    
    console.log('Setting up default organization...\n');
    
    // Check if any organization exists
    const existingOrg = await Organization.findOne();
    
    let defaultOrg;
    
    if (existingOrg) {
      console.log('✓ Organization already exists:', existingOrg.name);
      defaultOrg = existingOrg;
    } else {
      // Create default organization
      defaultOrg = new Organization({
        name: 'Default Organization',
        code: 'ORG001',
        email: 'admin@organization.com',
        phone: '+91-1234567890',
        address: {
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India'
        },
        settings: {
          requireOTP: true,
          otpExpiry: 10,
          allowSelfRegistration: false,
          maxPassValidity: 24,
          workingHours: {
            start: '09:00',
            end: '18:00'
          }
        },
        subscription: {
          plan: 'free',
          maxUsers: 10,
          maxVisitorsPerMonth: 100
        }
      });
      
      await defaultOrg.save();
      console.log('✓ Created default organization:', defaultOrg.name);
    }
    
    // Find users without organization
    const usersWithoutOrg = await User.find({ 
      $or: [
        { organization: null },
        { organization: { $exists: false } }
      ]
    });
    
    if (usersWithoutOrg.length > 0) {
      console.log(`\nFound ${usersWithoutOrg.length} users without organization:`);
      
      for (const user of usersWithoutOrg) {
        user.organization = defaultOrg._id;
        await user.save();
        console.log(`  ✓ Assigned ${user.email} to ${defaultOrg.name}`);
      }
    } else {
      console.log('\n✓ All users already have organizations assigned');
    }
    
    // Summary
    console.log('\n=== SETUP COMPLETE ===');
    console.log('Organization:', defaultOrg.name);
    console.log('Organization ID:', defaultOrg._id);
    console.log('Total users:', await User.countDocuments({ organization: defaultOrg._id }));
    
    process.exit(0);
  } catch (error) {
    console.error('Setup error:', error);
    process.exit(1);
  }
};

setupDefaultOrganization();
