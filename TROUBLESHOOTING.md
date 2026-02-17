# Login Issue Troubleshooting

## The Issue
You're trying to login with: `employee@company.com` / `employee@123`

**The correct password is: `employee123` (NOT `employee@123`)**

## Steps to Fix

### 1. Make sure MongoDB is running
```bash
# Check if MongoDB is running
mongod --version
```

### 2. Run the seed script to create users
```bash
cd backend
node seed.js
```

You should see:
```
Connected to MongoDB
Seed data created successfully!

Default Users:
Admin: admin@company.com / admin123
HR: hr@company.com / hr123
Manager: manager@company.com / manager123
Employee: employee@company.com / employee123
```

### 3. Test the login credentials
```bash
cd backend
node test-login.js
```

### 4. Start the backend server
```bash
cd backend
npm run dev
```

You should see:
```
Server running on port 5000
Connected to MongoDB
Cron jobs scheduled successfully
```

### 5. Start the frontend
```bash
cd frontend
npm start
```

### 6. Login with correct credentials
- **Email**: `employee@company.com`
- **Password**: `employee123` ⚠️ (NOT employee@123)

## All Default Credentials

| Role     | Email                  | Password     |
|----------|------------------------|--------------|
| Admin    | admin@company.com      | admin123     |
| HR       | hr@company.com         | hr123        |
| Manager  | manager@company.com    | manager123   |
| Employee | employee@company.com   | employee123  |

## Common Issues

### Issue: "Invalid credentials"
- **Solution**: Use `employee123` not `employee@123`
- Make sure you ran `node seed.js`

### Issue: "Cannot connect to server"
- **Solution**: Make sure backend is running on port 5000
- Check if MongoDB is running

### Issue: "Network Error"
- **Solution**: Check if REACT_APP_API_URL is set correctly in frontend/.env
- Should be: `REACT_APP_API_URL=http://localhost:5000`

## Debug Mode
The backend now has debug logging. Check the terminal where backend is running to see:
```
Login attempt: { email: 'employee@company.com', password: '***' }
User found: Yes
Password valid: true
```