#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🌱 Starting HRMS data seeding...');

try {
  // Run the seed script
  execSync('node seedData.js', { 
    cwd: path.join(__dirname),
    stdio: 'inherit' 
  });
  
  console.log('✅ Seeding completed successfully!');
  console.log('\n📋 Default users created:');
  console.log('  Admin: admin@company.com / admin123');
  console.log('  HR: hr@company.com / hr123');
  console.log('  Manager: manager@company.com / manager123');
  console.log('  Employee: employee@company.com / employee123');
  console.log('\n🏷️  Leave types created:');
  console.log('  - Annual Leave (12 days/year)');
  console.log('  - Sick Leave (6 days/year)');
  console.log('  - Casual Leave (5 days/year)');
  console.log('  - Maternity Leave (90 days/year)');
  
} catch (error) {
  console.error('❌ Seeding failed:', error.message);
  process.exit(1);
}