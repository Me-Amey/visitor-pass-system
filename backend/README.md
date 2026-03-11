# Backend - Visitor Pass Management System

## Overview
Node.js + Express backend with MongoDB for the Visitor Pass Management System.

## Project Structure

```
backend/
├── config/
│   └── db.js                 # MongoDB connection configuration
├── middleware/
│   └── auth.js               # JWT authentication middleware
├── models/
│   ├── User.js               # User model (Admin, Security, Employee, Visitor)
│   ├── Visitor.js            # Visitor information model
│   ├── Appointment.js        # Appointment scheduling model
│   ├── Pass.js               # Visitor pass model with QR code
│   └── CheckLog.js           # Check-in/check-out logs
├── routes/
│   ├── auth.js               # Authentication routes (login, register)
│   ├── visitors.js           # Visitor management routes
│   ├── appointments.js       # Appointment management routes
│   ├── passes.js             # Pass issuance and verification routes
│   └── checklogs.js          # Check-in/out logging routes
├── utils/
│   ├── email.js              # Email notification utility
│   └── pdf.js                # PDF generation utility
├── .env                      # Environment variables
├── .env.example              # Environment variables template
├── server.js                 # Main server file
├── seed.js                   # Database seeding script
└── package.json              # Dependencies and scripts
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/visitor-pass-db
JWT_SECRET=your_jwt_secret_key_here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
NODE_ENV=development
```

## Installation

```bash
# Install dependencies
npm install

# Seed demo data
npm run seed

# Start server
npm start

# Development mode (same as start)
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
  - Body: `{ name, email, password, role, phone, department }`
  - Returns: `{ token, user }`

- `POST /api/auth/login` - Login user
  - Body: `{ email, password }`
  - Returns: `{ token, user }`

### Visitors
- `GET /api/visitors` - Get all visitors (requires auth)
- `POST /api/visitors` - Register new visitor (requires auth)
- `GET /api/visitors/:id` - Get visitor by ID (requires auth)
- `GET /api/visitors?search=query` - Search visitors (requires auth)

### Appointments
- `GET /api/appointments` - Get appointments (requires auth)
- `POST /api/appointments` - Create appointment (requires auth)
- `PATCH /api/appointments/:id/status` - Update appointment status (requires auth)

### Passes
- `GET /api/passes` - Get all passes (requires auth)
- `POST /api/passes` - Issue new pass (requires admin/security)
- `POST /api/passes/verify` - Verify pass by QR code (requires auth)
- `GET /api/passes/:id/pdf` - Download pass PDF (requires auth)

### Check Logs
- `GET /api/checklogs` - Get check-in/out logs (requires auth)
- `POST /api/checklogs` - Create check-in/out entry (requires admin/security)
- `GET /api/checklogs?startDate=&endDate=&type=` - Filter logs (requires auth)

### System
- `GET /` - API information
- `GET /health` - Health check endpoint

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## User Roles

- **admin**: Full system access
- **security**: Issue passes, check-in/out, view logs
- **employee**: Create appointments, view visitors
- **visitor**: View own appointments and passes

## Demo Credentials

After running `npm run seed`:

```
Admin:
  Email: admin@example.com
  Password: admin123

Security:
  Email: security@example.com
  Password: security123

Employee:
  Email: john@example.com
  Password: employee123
```

## Database Models

### User
- name, email, password (hashed), role, phone, department, isActive

### Visitor
- name, email, phone, idType, idNumber, photo, company, address

### Appointment
- visitor (ref), host (ref), purpose, scheduledDate, scheduledTime, status, notes

### Pass
- passNumber, visitor (ref), appointment (ref), host (ref), issuedBy (ref)
- qrCode, validFrom, validUntil, status

### CheckLog
- pass (ref), visitor (ref), type (check-in/check-out)
- timestamp, verifiedBy (ref), location, notes

## Error Handling

The API returns consistent error responses:

```json
{
  "message": "Error description",
  "stack": "Stack trace (development only)"
}
```

HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Input validation
- CORS enabled
- Environment variable protection

## Dependencies

### Core
- express: Web framework
- mongoose: MongoDB ODM
- dotenv: Environment variables
- cors: Cross-origin resource sharing

### Authentication
- jsonwebtoken: JWT tokens
- bcryptjs: Password hashing

### Features
- qrcode: QR code generation
- pdfkit: PDF generation
- nodemailer: Email notifications
- multer: File uploads

## Development

```bash
# Start server with auto-reload (requires nodemon)
npm install -g nodemon
nodemon server.js

# Run seed script
npm run seed

# Check MongoDB connection
node -e "require('./config/db.js').connectDB()"
```

## Testing

```bash
# Test API endpoints
curl http://localhost:5000/health

# Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `net start MongoDB`
- Check MONGODB_URI in .env
- Verify port 27017 is not blocked

### Port Already in Use
- Change PORT in .env
- Kill process using port 5000: `netstat -ano | findstr :5000`

### JWT Token Invalid
- Check JWT_SECRET in .env
- Ensure token is sent in Authorization header
- Token format: `Bearer <token>`

## Production Deployment

1. Set NODE_ENV=production in .env
2. Use strong JWT_SECRET
3. Configure email settings
4. Use MongoDB Atlas for database
5. Enable HTTPS
6. Set up proper logging
7. Configure rate limiting
8. Enable security headers

## License

MIT
