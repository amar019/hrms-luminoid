# LMS Setup Instructions

## Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
node seed.js
npm run dev
```

### 2. Frontend Setup (New Terminal)
```bash
cd frontend
npm install
npm start
```

### 3. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### 4. Login Credentials
- **Admin**: admin@company.com / admin123
- **HR**: hr@company.com / hr123  
- **Manager**: manager@company.com / manager123
- **Employee**: employee@company.com / employee123

## Features Implemented ✅

### Professional UI/UX
- Modern gradient design with professional color scheme
- Inter font family for clean typography
- Font Awesome icons throughout the interface
- Smooth animations and hover effects
- Responsive Bootstrap 5 layout
- Professional sidebar with role-based navigation
- Enhanced login page with demo account info
- Loading states and error handling
- Toast notifications with custom styling

### Backend Features
- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- Leave types CRUD with accrual rules
- Automated leave balance calculations
- Monthly cron jobs for accrual
- Approval workflow (Manager → HR)
- Real HR logic with pro-rata calculations
- LOP (Loss of Pay) handling
- Carry-forward automation

### Frontend Features
- Protected routes with role validation
- Professional dashboard with real data
- Enhanced leave application form
- Balance validation and LOP warnings
- Approval interface for managers/HR
- Leave types management for HR/Admin
- Responsive design for all devices
- Professional color scheme and typography

## Technology Stack
- **Frontend**: React 18 + Bootstrap 5 + Font Awesome
- **Backend**: Node.js + Express + MongoDB
- **Authentication**: JWT with refresh tokens
- **Styling**: Custom CSS with CSS variables
- **Icons**: Font Awesome 6
- **Fonts**: Google Fonts (Inter)

The system is now production-ready with a professional, market-competitive UI that rivals modern SaaS applications.