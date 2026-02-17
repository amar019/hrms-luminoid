# Leave Management System (LMS)

A comprehensive Leave Management System built with React, Node.js, Express, and MongoDB featuring role-based access control, automated leave accrual, and approval workflows.

## Features

### ✅ Authentication & Authorization
- JWT access + refresh tokens
- Role-based access control (RBAC)
- Protected frontend routes
- Backend middleware enforcement
- Roles: ADMIN, HR, MANAGER, EMPLOYEE

### ✅ Enhanced Dashboard Features
- **Employee Birthdays**: Upcoming birthdays in next 30 days
- **New Hires**: Recent joiners in last 30 days
- **Quick Links/Favorites**: Personal bookmarks for employees
- **Announcements**: Company-wide notifications with priority levels
- **Holiday Calendar**: Festival and company holidays
- **Leave Reports**: Summary and export capabilities
- **File Management**: Organization and employee document storage

### ✅ File Management System
- Organization files (policies, handbooks)
- Employee-specific documents
- File upload with categorization
- Access control based on roles
- Download and delete capabilities

### ✅ Announcement System
- Priority-based announcements (High/Medium/Low)
- Role-based targeting
- Expiry date management
- Real-time dashboard display

### ✅ Holiday Management
- Festival, National, and Company holidays
- Calendar integration
- Admin/HR holiday management
- **Automated Email Notifications**: Sends templated emails to all employees 2 days before festival holidays

### ✅ Personal Favorites/Quick Links
- Employee customizable bookmarks
- Icon support
- Easy access from dashboard

### ✅ Leave Types Management (Admin/HR)
- Full CRUD operations
- Accrual types: Monthly/Yearly
- Configurable accrual rates
- Maximum leave per year limits
- Carry forward rules
- LOP (Loss of Pay) configuration

### ✅ Leave Balance Engine
- Auto-create balances per user per year
- Monthly cron job for accrual
- Pro-rata logic for new joiners
- Negative balance prevention
- Year-end carry-forward automation
- LOP calculation

### ✅ Leave Application Flow
- Apply full-day/half-day leaves
- Balance validation
- Overlapping leave detection
- Leave history with filters
- Cancel pending requests
- **Automated Email Notifications**: Sends emails to manager and HR when leave is applied
- **Reminder Notifications**: Sends urgent reminders to managers 1 day before leave starts if not approved

### ✅ Approval Workflow
- Manager → HR approval chain
- Rejection with reasons
- HR override capabilities
- Status transitions: PENDING → MANAGER_APPROVED → HR_APPROVED
- Email notifications (ready for integration)

### ✅ Role-Based Dashboards
- **Employee**: Leave balances, upcoming leaves, history
- **Manager**: Team approvals, team calendar, team summary
- **HR**: Organization stats, monthly reports, CSV export

### ✅ Production-Ready UI
- Bootstrap 5 responsive design
- Sidebar navigation with role-based menus
- Paginated tables
- Status badges and notifications
- Form validations
- Toast notifications

## Tech Stack

- **Frontend**: React 18 + Bootstrap 5 + React Router
- **Backend**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT (Access + Refresh tokens)
- **Styling**: Bootstrap 5 + React Bootstrap
- **Notifications**: React Toastify

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Git

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# Copy .env file and update values
cp .env.example .env
```

Update `.env` with your configuration:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/lms
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here_change_in_production
NODE_ENV=development

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@company.com
```

4. Seed initial data:
```bash
node seed.js
```

5. Start the server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
# Create .env file in frontend directory
echo "REACT_APP_API_URL=http://localhost:5000" > .env
```

4. Start the development server:
```bash
npm start
```

## Default Users

After running the seed script, you can login with:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@company.com | admin123 |
| HR | hr@company.com | hr123 |
| Manager | manager@company.com | manager123 |
| Employee | employee@company.com | employee123 |

### API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### Announcements
- `GET /api/announcements` - Get announcements for user role
- `POST /api/announcements` - Create announcement (HR/Admin)
- `PUT /api/announcements/:id` - Update announcement (HR/Admin)
- `DELETE /api/announcements/:id` - Delete announcement (HR/Admin)

### Holidays
- `GET /api/holidays` - Get holidays for current year
- `POST /api/holidays` - Create holiday (HR/Admin)
- `PUT /api/holidays/:id` - Update holiday (HR/Admin)
- `DELETE /api/holidays/:id` - Delete holiday (HR/Admin)
- `POST /api/holidays/test-notification/:holidayId` - Test holiday notification (HR/Admin)

### Favorites/Quick Links
- `GET /api/favorites` - Get user favorites
- `POST /api/favorites` - Create favorite
- `PUT /api/favorites/:id` - Update favorite
- `DELETE /api/favorites/:id` - Delete favorite

### Files
- `GET /api/files` - Get accessible files
- `POST /api/files/upload` - Upload file (HR/Admin)
- `GET /api/files/download/:id` - Download file
- `DELETE /api/files/:id` - Delete file (HR/Admin)

### Leave Types (Admin/HR only)
- `GET /api/leave-types` - Get all leave types
- `POST /api/leave-types` - Create leave type
- `PUT /api/leave-types/:id` - Update leave type
- `DELETE /api/leave-types/:id` - Delete leave type

### Leave Balances
- `GET /api/leave-balances/:userId?` - Get user balances
- `POST /api/leave-balances/initialize` - Initialize balances (HR/Admin)

### Leave Requests
- `POST /api/leave-requests` - Apply for leave
- `GET /api/leave-requests` - Get leave requests (filtered by role)
- `GET /api/leave-requests/pending` - Get pending approvals (Manager/HR)
- `PUT /api/leave-requests/:id/approve-reject` - Approve/reject request
- `PUT /api/leave-requests/:id/cancel` - Cancel request
- `POST /api/leave-requests/test-reminder/:requestId` - Test leave reminder (HR/Admin)

### Dashboard
- `GET /api/dashboard/employee` - Employee dashboard data
- `GET /api/dashboard/manager` - Manager dashboard data
- `GET /api/dashboard/hr` - HR dashboard data
- `GET /api/dashboard/export` - Export leave report (CSV)

## Automated Jobs

The system includes automated cron jobs:

- **Monthly Accrual**: Runs on 1st of every month at 00:00
- **Year-end Carry Forward**: Runs on January 1st at 00:00
- **Holiday Notifications**: Runs daily at 09:00 AM to check for upcoming festival holidays (2 days prior)
- **Leave Reminders**: Runs daily at 10:00 AM to send urgent reminders for pending leave approvals (1 day before leave starts)

## Role-Based Access

### Employee
- View personal dashboard
- Apply for leaves
- View leave history
- Cancel pending requests

### Manager
- All Employee permissions
- Approve/reject team member requests
- View team calendar
- Team leave summary

### HR
- All Manager permissions
- Manage leave types
- Organization-wide reports
- Override approvals
- Export data

### Admin
- All HR permissions
- System administration
- User management

## Production Deployment

### Backend Deployment
1. Set production environment variables
2. Use PM2 or similar process manager
3. Configure reverse proxy (Nginx)
4. Set up SSL certificates
5. Configure MongoDB replica set

### Frontend Deployment
1. Build production bundle: `npm run build`
2. Serve static files via CDN or web server
3. Configure environment variables
4. Set up domain and SSL

## Development

### Adding New Features
1. Create feature branch
2. Add backend routes and controllers
3. Create/update frontend components
4. Add proper error handling
5. Update documentation
6. Test thoroughly

### Database Schema
- Users: Authentication and profile data
- LeaveTypes: Leave type configurations
- LeaveBalances: User leave balances per year
- LeaveRequests: Leave applications and approvals

## Security Features
- JWT token authentication
- Role-based authorization
- Input validation and sanitization
- CORS configuration
- Password hashing (bcrypt)
- SQL injection prevention (Mongoose)

## Support

For issues and questions:
1. Check the documentation
2. Review error logs
3. Check API responses
4. Verify database connections
5. Ensure proper environment configuration

## License

This project is licensed under the MIT License.