const cron = require('node-cron');
const { accrueBalances, carryForward } = require('../controllers/leaveBalanceController');
const Holiday = require('../models/Holiday');
const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const { sendHolidayNotification, sendLeaveReminderNotification } = require('./emailService');

// Monthly accrual on 1st of every month at 00:00
cron.schedule('0 0 1 * *', async () => {
  console.log('Running monthly accrual...');
  await accrueBalances();
});

// Year-end carry forward on January 1st at 00:00
cron.schedule('0 0 1 1 *', async () => {
  console.log('Running year-end carry forward...');
  await carryForward();
});

// Holiday notification - runs daily at 09:00 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Checking for upcoming holidays...');
  
  const twoDaysFromNow = new Date();
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
  twoDaysFromNow.setHours(0, 0, 0, 0);
  
  const nextDay = new Date(twoDaysFromNow);
  nextDay.setDate(nextDay.getDate() + 1);
  
  try {
    const upcomingHolidays = await Holiday.find({
      type: 'FESTIVAL',
      date: {
        $gte: twoDaysFromNow,
        $lt: nextDay
      }
    });
    
    if (upcomingHolidays.length > 0) {
      const employees = await User.find({ role: { $in: ['EMPLOYEE', 'MANAGER', 'HR'] } });
      
      for (const holiday of upcomingHolidays) {
        await sendHolidayNotification(employees, holiday);
      }
    }
  } catch (error) {
    console.error('Error in holiday notification job:', error);
  }
});

// Leave reminder - runs daily at 10:00 AM
cron.schedule('0 10 * * *', async () => {
  console.log('Checking for pending leave approvals...');
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
  
  try {
    const pendingLeaves = await LeaveRequest.find({
      status: 'PENDING',
      startDate: {
        $gte: tomorrow,
        $lt: dayAfterTomorrow
      }
    }).populate(['userId', 'leaveTypeId']);
    
    for (const leaveRequest of pendingLeaves) {
      await sendLeaveReminderNotification(leaveRequest);
    }
    
    if (pendingLeaves.length > 0) {
      console.log(`Sent ${pendingLeaves.length} leave reminder notifications`);
    }
  } catch (error) {
    console.error('Error in leave reminder job:', error);
  }
});

console.log('Cron jobs scheduled successfully');

