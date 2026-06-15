const nodemailer = require('nodemailer');
const User = require('../models/User');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter on startup
transporter.verify((error) => {
  if (error) {
    console.error('[EMAIL] SMTP connection failed:', error.message);
  }
});

const sendHolidayNotification = async (employees, holiday) => {
  const emailPromises = employees.map(employee => {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@company.com',
      to: employee.email,
      subject: `Upcoming Holiday: ${holiday.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px;">Upcoming Holiday Notification</h2>
          <p>Dear ${employee.name || employee.firstName},</p>
          <p>We wanted to remind you about an upcoming holiday:</p>
          
          <div style="margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Holiday:</strong> ${holiday.name}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(holiday.date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <p style="margin: 5px 0;"><strong>Type:</strong> ${holiday.type}</p>
            ${holiday.description ? `<p style="margin: 5px 0;"><strong>Description:</strong> ${holiday.description}</p>` : ''}
          </div>
          
          <p>Please plan your work accordingly.</p>
          
          <p>Best regards,<br>HR Team</p>
        </div>
      `
    };
    
    return transporter.sendMail(mailOptions);
  });

  try {
    await Promise.all(emailPromises);
  } catch (error) {
    console.error('Error sending holiday notifications:', error);
  }
};

const sendLeaveApplicationNotification = async (leaveRequest) => {
  try {
    const employee = await User.findById(leaveRequest.userId).populate('managerId');
    const manager = employee.managerId;
    const hrUsers = await User.find({ role: 'HR' });
    
    const recipients = [];
    if (manager) recipients.push(manager);
    recipients.push(...hrUsers);
    
    const emailPromises = recipients.map(recipient => {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@company.com',
        to: recipient.email,
        subject: `Leave Application - ${employee.firstName} ${employee.lastName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px;">New Leave Application</h2>
            <p>Dear ${recipient.firstName},</p>
            <p>A new leave application has been submitted and requires your review:</p>
            
            <div style="margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Employee:</strong> ${employee.firstName} ${employee.lastName}</p>
              <p style="margin: 5px 0;"><strong>Leave Type:</strong> ${leaveRequest.leaveTypeId?.name || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Start Date:</strong> ${new Date(leaveRequest.startDate).toLocaleDateString()}</p>
              <p style="margin: 5px 0;"><strong>End Date:</strong> ${new Date(leaveRequest.endDate).toLocaleDateString()}</p>
              <p style="margin: 5px 0;"><strong>Duration:</strong> ${leaveRequest.days} day(s)</p>
              <p style="margin: 5px 0;"><strong>Reason:</strong> ${leaveRequest.reason}</p>
            </div>
            
            <p>Please review and approve this leave application at your earliest convenience.</p>
            <p>Best regards,<br>HR Team</p>
          </div>
        `
      };
      return transporter.sendMail(mailOptions);
    });
    
    await Promise.all(emailPromises);
  } catch (error) {
    console.error('Error sending leave application notification:', error);
  }
};

const sendLeaveReminderNotification = async (leaveRequest) => {
  try {
    const employee = await User.findById(leaveRequest.userId).populate('managerId');
    const manager = employee.managerId;
    
    if (!manager) return;
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@company.com',
      to: manager.email,
      subject: `URGENT: Leave Approval Reminder - ${employee.firstName} ${employee.lastName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px;">Leave Approval Reminder</h2>
          <p>Dear ${manager.firstName},</p>
          <p>This is a reminder that the following leave application is still pending your approval and the leave starts tomorrow:</p>
          
          <div style="margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Employee:</strong> ${employee.firstName} ${employee.lastName}</p>
            <p style="margin: 5px 0;"><strong>Leave Type:</strong> ${leaveRequest.leaveTypeId?.name || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Start Date:</strong> ${new Date(leaveRequest.startDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>End Date:</strong> ${new Date(leaveRequest.endDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Duration:</strong> ${leaveRequest.days} day(s)</p>
            <p style="margin: 5px 0;"><strong>Reason:</strong> ${leaveRequest.reason}</p>
          </div>
          
          <p><strong>Please approve or reject this application as soon as possible.</strong></p>
          <p>Best regards,<br>HR Team</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending leave reminder notification:', error);
  }
};

const sendHalfDayLOPNotification = async (user, attendance) => {
  try {
    let subject, statusMessage, requiredHours;
    
    if (attendance.totalHours < 4) {
      subject = 'LOP - Loss of Pay Due to Insufficient Working Hours';
      statusMessage = 'LOP (Loss of Pay)';
      requiredHours = 'Minimum 4 hours for half day, 8 hours for full day';
    } else if (attendance.totalHours < 8) {
      subject = 'Half Day - Insufficient Working Hours';
      statusMessage = 'Half Day';
      requiredHours = 'Minimum 8 hours for full day';
    }
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@company.com',
      to: user.email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px;">${statusMessage} Notice</h2>
          <p>Dear ${user.firstName},</p>
          <p>Your attendance for today has been marked as ${statusMessage} due to insufficient working hours:</p>
          
          <div style="margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(attendance.date).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Check In:</strong> ${new Date(attendance.checkIn).toLocaleTimeString()}</p>
            <p style="margin: 5px 0;"><strong>Check Out:</strong> ${new Date(attendance.checkOut).toLocaleTimeString()}</p>
            <p style="margin: 5px 0;"><strong>Total Hours:</strong> ${attendance.totalHours} hours</p>
            <p style="margin: 5px 0;"><strong>Required:</strong> ${requiredHours}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> ${attendance.status}</p>
          </div>
          
          <p>${attendance.totalHours < 4 ? 
            'This will be marked as Loss of Pay (LOP) and no salary will be credited for this day.' : 
            'This will be reflected as a half day deduction in your payroll.'} Please ensure you complete minimum working hours daily.</p>
          <p>For any queries, please contact HR.</p>
          
          <p>Best regards,<br>HR Team</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending attendance notification:', error);
  }
};

const sendLeaveApprovalNotification = async (leaveRequest, approverName, approvalType) => {
  try {
    const employee = await User.findById(leaveRequest.userId);
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@company.com',
      to: employee.email,
      subject: `Leave Approved - ${new Date(leaveRequest.startDate).toLocaleDateString()} to ${new Date(leaveRequest.endDate).toLocaleDateString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px;">Leave Request Approved</h2>
          <p>Dear ${employee.firstName},</p>
          <p>Your leave request has been approved by ${approverName} (${approvalType}):</p>
          
          <div style="margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Leave Type:</strong> ${leaveRequest.leaveTypeId?.name || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>From:</strong> ${new Date(leaveRequest.startDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>To:</strong> ${new Date(leaveRequest.endDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Duration:</strong> ${leaveRequest.days} day(s)</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> ${leaveRequest.status.replace('_', ' ')}</p>
          </div>
          
          <p>You can now proceed with your planned leave.</p>
          <p>Best regards,<br>HR Team</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending leave approval notification:', error);
  }
};

const sendAnnouncementNotification = async (announcement, creatorName) => {
  try {
    const filter = { isActive: true };

    if (announcement.targetRoles && announcement.targetRoles.length > 0) {
      filter.role = { $in: announcement.targetRoles };
    }

    if (announcement.targetDepartments && announcement.targetDepartments.length > 0) {
      filter.$or = [
        { department: { $in: announcement.targetDepartments.map(d => d.toString()) } },
        { 'department._id': { $in: announcement.targetDepartments } }
      ];
    }

    const employees = await User.find(filter).select('email firstName lastName');

    if (employees.length === 0) {
      return;
    }

    const batchSize = 5;
    for (let i = 0; i < employees.length; i += batchSize) {
      const batch = employees.slice(i, i + batchSize);

      const emailPromises = batch.map(employee => {
        const mailOptions = {
          from: process.env.SMTP_FROM || 'noreply@company.com',
          to: employee.email,
          subject: `[${announcement.priority}] ${announcement.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px;">New Announcement</h2>
              <p>Dear ${employee.firstName},</p>
              
              <div style="margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0;">${announcement.title}</h3>
                <p style="margin: 0; line-height: 1.5;">${announcement.content}</p>
              </div>
              
              <div style="margin-top: 20px;">
                <p style="margin: 5px 0;"><strong>From:</strong> ${creatorName}</p>
                <p style="margin: 5px 0;"><strong>Priority:</strong> ${announcement.priority}</p>
                ${announcement.expiryDate ? `<p style="margin: 5px 0;"><strong>Valid until:</strong> ${new Date(announcement.expiryDate).toLocaleDateString()}</p>` : ''}
              </div>
              
              <p style="margin-top: 30px;">Best regards,<br>Luminoid HRMS</p>
            </div>
          `
        };
        return transporter.sendMail(mailOptions).catch(err =>
          console.error(`Failed to send announcement email to ${employee.email}:`, err.message)
        );
      });

      await Promise.all(emailPromises);

      if (i + batchSize < employees.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  } catch (error) {
    console.error('Error sending announcement notification:', error);
  }
};

const sendBirthdayWishes = async (employee) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@company.com',
      to: employee.email,
      subject: `Happy Birthday ${employee.firstName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px;">Happy Birthday!</h2>
          <p>Dear ${employee.firstName},</p>
          
          <p>On behalf of the entire team, we wish you a very Happy Birthday!</p>
          <p>We hope you have a wonderful day and a year filled with success and happiness.</p>
          
          <p>Best wishes,<br>Your Team & HR Department</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending birthday wishes:', error);
  }
};

const sendWelcomeEmail = async ({ to, name, password, loginUrl }) => {
  try {
    // Ensuring the correct URL is sent regardless of environment
    const overrideLoginUrl = 'https://hrms-krishigyanai.netlify.app/login';
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@company.com',
      to: to,
      subject: 'Welcome to the Team',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px;">Welcome Aboard!</h2>
          <p>Dear ${name},</p>
          <p>Welcome to our team. We're excited to have you on board.</p>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #333; margin: 0 0 10px 0;">Your Login Credentials</h3>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${to}</p>
            <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${password}</p>
            <p style="margin: 15px 0 5px 0;"><strong>Login URL:</strong> <a href="${overrideLoginUrl}">${overrideLoginUrl}</a></p>
          </div>
          
          <p><strong>Important:</strong> Please change your password after your first login for security.</p>
          
          <p>If you have any questions, feel free to reach out to HR.</p>
          <p>Best regards,<br>HR Team</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

const sendExpenseDeadlineReminder = async (employees, daysLeft, lastDay, billingMonth) => {
  const [year, month] = billingMonth.split('-');
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  let urgencyLabel, daysLeftText;
  
  if (daysLeft === 0) {
    urgencyLabel = 'LAST DAY TODAY';
    daysLeftText = 'today (last day)';
  } else if (daysLeft === 1) {
    urgencyLabel = 'LAST DAY TOMORROW';
    daysLeftText = '1 day';
  } else {
    urgencyLabel = `Only ${daysLeft} Days Left`;
    daysLeftText = `${daysLeft} days`;
  }

  const emailPromises = employees.map(employee => {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@company.com',
      to: employee.email,
      subject: `[Action Required] Submit Your ${monthName} Expenses — ${daysLeft === 0 ? 'Last Day' : daysLeftText + ' Left'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px;">Expense Submission Reminder</h2>
          <p>Dear ${employee.firstName},</p>
          
          <p>This is a reminder to submit all your pending expense claims for <strong>${monthName}</strong>.</p>
          
          <div style="margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Status:</strong> ${urgencyLabel}</p>
            <p style="margin: 5px 0;">
              ${daysLeft === 0 
                ? `Today is the last day to submit expenses for ${monthName}. Submit before midnight.` 
                : `The expense submission window for ${monthName} closes on the ${lastDay}th. After that, no expenses can be submitted or claimed.`
              }
            </p>
          </div>
          
          <p><strong>Before the deadline, make sure you have:</strong></p>
          <ul>
            <li>Submitted all expense claims for ${monthName}</li>
            <li>Uploaded bills/receipts for each expense</li>
            <li>Verified the amounts and categories are correct</li>
          </ul>
          
          <p>Please submit your expenses through the HRMS platform as soon as possible.</p>
          
          <p>Best regards,<br>HR Team</p>
        </div>
      `
    };
    return transporter.sendMail(mailOptions).catch(err =>
      console.error(`Failed to send expense reminder to ${employee.email}:`, err.message)
    );
  });

  try {
    await Promise.all(emailPromises);
  } catch (error) {
    console.error('Error sending expense deadline reminders:', error);
  }
};

module.exports = { 
  sendHolidayNotification, 
  sendLeaveApplicationNotification, 
  sendLeaveReminderNotification,
  sendHalfDayLOPNotification,
  sendLeaveApprovalNotification,
  sendAnnouncementNotification,
  sendBirthdayWishes,
  sendWelcomeEmail,
  sendExpenseDeadlineReminder
};