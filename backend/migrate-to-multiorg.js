import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Organization from './models/Organization.js';
import User from './models/User.js';
import Visitor from './models/Visitor.js';
import Pass from './models/Pass.js';
import Appointment from './models/Appointment.js';
import CheckLog from './models/CheckLog.js';

dotenv.config();

const migrateToMultiOrg = async () => {
  try {
    console.log('🚀 Starting migration to multi-organization structure...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Create default organization
    console.log('📋 Step 1: Creating default organization...');
    let defaultOrg = await Organization.findOne({ code: 'DEFAULT' });
    
    if (!defaultOrg) {
      defaultOrg = new Organization({
        name: 'Default Organization',
        code: 'DEFAULT',
        email: 'admin@default.org',
        phone: '+1234567890',
        address: {
          street: '123 Main St',
          city: 'City',
          state: 'State',
          zipCode: '12345',
          country: 'Country'
        },
        settings: {
          requireOTP: true,
          otpExpiry: 10,
          allowSelfRegistration: false,
          maxPassValidity: 24,
          workingHours: {
            start: '09:00',
            end: '18:00'
          },
          allowedAccessAreas: ['Lobby', 'Reception', 'Conference Room', 'Cafeteria']
        },
        subscription: {
          plan: 'premium',
          maxUsers: 100,
          maxVisitorsPerMonth: 1000
        }
      });
      await defaultOrg.save();
      console.log(`✅ Created default organization: ${defaultOrg.name} (${defaultOrg._id})\n`);
    } else {
      console.log(`✅ Default organization already exists: ${defaultOrg.name} (${defaultOrg._id})\n`);
    }

    // Step 2: Update users
    console.log('📋 Step 2: Updating users...');
    const usersWithoutOrg = await User.find({ organization: { $exists: false } });
    console.log(`Found ${usersWithoutOrg.length} users without organization`);
    
    for (const user of usersWithoutOrg) {
      // Update role mapping
      let newRole = user.role;
      if (user.role === 'admin') {
        newRole = 'org_admin';
      }
      
      user.organization = defaultOrg._id;
      user.role = newRole;
      
      // Assign default permissions based on role
      if (newRole === 'org_admin') {
        user.permissions = [
          'manage_users',
          'manage_visitors',
          'manage_passes',
          'manage_appointments',
          'view_reports',
          'manage_settings'
        ];
      } else if (newRole === 'security') {
        user.permissions = ['manage_passes', 'manage_visitors'];
      }
      
      await user.save();
    }
    console.log(`✅ Updated ${usersWithoutOrg.length} users\n`);

    // Step 3: Update visitors
    console.log('📋 Step 3: Updating visitors...');
    const visitorsWithoutOrg = await Visitor.find({ organization: { $exists: false } });
    console.log(`Found ${visitorsWithoutOrg.length} visitors without organization`);
    
    for (const visitor of visitorsWithoutOrg) {
      visitor.organization = defaultOrg._id;
      await visitor.save();
    }
    console.log(`✅ Updated ${visitorsWithoutOrg.length} visitors\n`);

    // Step 4: Update passes
    console.log('📋 Step 4: Updating passes...');
    const passesWithoutOrg = await Pass.find({ organization: { $exists: false } });
    console.log(`Found ${passesWithoutOrg.length} passes without organization`);
    
    for (const pass of passesWithoutOrg) {
      pass.organization = defaultOrg._id;
      // If requireOTP is false, mark existing passes as verified
      if (!defaultOrg.settings.requireOTP) {
        pass.otpVerified = true;
      }
      await pass.save();
    }
    console.log(`✅ Updated ${passesWithoutOrg.length} passes\n`);

    // Step 5: Update appointments
    console.log('📋 Step 5: Updating appointments...');
    const appointmentsWithoutOrg = await Appointment.find({ organization: { $exists: false } });
    console.log(`Found ${appointmentsWithoutOrg.length} appointments without organization`);
    
    for (const appointment of appointmentsWithoutOrg) {
      appointment.organization = defaultOrg._id;
      await appointment.save();
    }
    console.log(`✅ Updated ${appointmentsWithoutOrg.length} appointments\n`);

    // Step 6: Update check logs
    console.log('📋 Step 6: Updating check logs...');
    const logsWithoutOrg = await CheckLog.find({ organization: { $exists: false } });
    console.log(`Found ${logsWithoutOrg.length} check logs without organization`);
    
    for (const log of logsWithoutOrg) {
      log.organization = defaultOrg._id;
      await log.save();
    }
    console.log(`✅ Updated ${logsWithoutOrg.length} check logs\n`);

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Migration completed successfully!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Organization: ${defaultOrg.name}`);
    console.log(`Organization ID: ${defaultOrg._id}`);
    console.log(`Users updated: ${usersWithoutOrg.length}`);
    console.log(`Visitors updated: ${visitorsWithoutOrg.length}`);
    console.log(`Passes updated: ${passesWithoutOrg.length}`);
    console.log(`Appointments updated: ${appointmentsWithoutOrg.length}`);
    console.log(`Check logs updated: ${logsWithoutOrg.length}`);
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📝 Next steps:');
    console.log('1. Review the default organization settings');
    console.log('2. Update organization details as needed');
    console.log('3. Configure email settings for OTP');
    console.log('4. Test pass issuance with OTP');
    console.log('5. Create additional organizations if needed\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migration
migrateToMultiOrg();
