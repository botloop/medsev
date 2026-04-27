# Philippine Coast Guard Personnel Management System - Deployment Guide

## 🎉 Implementation Complete!

All core features have been implemented:
- ✅ Authentication (Google Sign-In + Serial Number)
- ✅ Personnel Management (CRUD operations)
- ✅ Analytics Dashboard
- ✅ Activity Log System
- ✅ Medical Results Upload (Base64 temporary storage)
- ✅ Role-Based Access Control
- ✅ Security Rules (Firestore + Storage)

---

## 📋 Pre-Deployment Checklist

### 1. Environment Variables

#### Server (`.env`)
```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# JWT Configuration
JWT_SECRET=CHANGE_THIS_TO_A_RANDOM_SECRET_KEY_IN_PRODUCTION
JWT_EXPIRE=24h

# CORS Configuration
CORS_ORIGIN=https://your-production-domain.web.app

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

#### Client (`.env.local`)
```bash
# API Configuration
REACT_APP_API_URL=https://your-backend-api-url.run.app/api

# Firebase Client SDK
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

### 2. Firebase Project Setup

1. **Create Firebase Project**
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools

   # Login to Firebase
   firebase login

   # Initialize project
   firebase init
   ```

2. **Enable Services**
   - ✅ Authentication (Google Sign-In provider)
   - ✅ Firestore Database
   - ✅ Firebase Storage (optional - for future migration from base64)
   - ✅ Firebase Hosting

3. **Create Service Account**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file securely
   - Extract credentials for `.env` file

### 3. Deploy Security Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules (when ready to migrate from base64)
firebase deploy --only storage:rules
```

---

## 🚀 Deployment Steps

### Option 1: Deploy to Firebase Hosting + Google Cloud Run

#### Step 1: Deploy Backend to Cloud Run

```bash
# Navigate to server directory
cd server

# Build the server
npm run build

# Deploy to Cloud Run (one-time setup)
gcloud run deploy pcg-personnel-backend \
  --source . \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,PORT=8080"

# Set environment variables
gcloud run services update pcg-personnel-backend \
  --update-env-vars JWT_SECRET=your-secret,FIREBASE_PROJECT_ID=your-project \
  --region asia-southeast1
```

**Note**: Copy the Cloud Run URL and update `REACT_APP_API_URL` in client `.env.local`

#### Step 2: Deploy Frontend to Firebase Hosting

```bash
# Navigate to client directory
cd client

# Update .env.local with production values
# Build the frontend
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### Option 2: Alternative Deployment (Vercel + Railway)

#### Backend (Railway)
1. Push code to GitHub
2. Connect Railway to repository
3. Add environment variables
4. Deploy

#### Frontend (Vercel)
1. Push code to GitHub
2. Connect Vercel to repository
3. Add environment variables
4. Deploy

---

## 🔐 Security Configuration

### 1. Update Admin Email

In `server/src/controllers/auth.controller.ts`, update line 40:

```typescript
// Change this to your admin email
const role = userEmail === 'YOUR_ADMIN_EMAIL@gmail.com' ? 'admin' : 'viewer';
```

### 2. Generate Strong JWT Secret

```bash
# Generate a random 64-character secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Configure CORS

Update `CORS_ORIGIN` in server `.env` to match your frontend domain.

### 4. Firebase App Check (Recommended for Production)

```bash
# Enable App Check in Firebase Console
# Add reCAPTCHA v3 for web
# Add debug tokens for development
```

---

## 📊 Activity Log System

The activity log system tracks all user actions:

### Logged Actions
- ✅ Login (Google + Serial Number)
- ✅ Logout
- ✅ Personnel Create/Update/Delete
- ✅ Medical Results Upload/Delete

### Viewing Activity Logs
1. Login as admin or medical role
2. Navigate to "Activity Log" tab
3. Filter by action type, resource, or date
4. View detailed activity information

### Activity Log Features
- Real-time activity tracking
- Filter by action, resource, user
- Detailed metadata for each action
- Pagination support
- Visual indicators for different action types

---

## 🏥 Medical Results Upload

### Current Implementation (Base64 Storage)
- Files stored as base64 in Firestore
- **Maximum file size**: 500KB
- Supported formats: JPEG, PNG, GIF, PDF
- Temporary solution (low cost, no Firebase Storage fees)

### Future Migration to Firebase Storage

When ready to support larger files:

1. **Enable Firebase Storage** in console
2. **Update Upload Controller** (`server/src/controllers/upload.controller.ts`)
   - Uncomment Firebase Storage code
   - Remove base64 conversion code
3. **Deploy Storage Rules**
   ```bash
   firebase deploy --only storage:rules
   ```
4. **Update File Size Limits**
   - Change from 500KB to 5MB or higher

---

## 👥 User Management

### Creating Users

Users are automatically created on first login via Google. For serial number authentication:

1. **Create user in Firestore** (using Firebase Console or admin script):
   ```json
   {
     "uid": "unique-user-id",
     "email": "user@example.com",
     "displayName": "User Name",
     "serialNumber": "PCG-12345",
     "role": "viewer",
     "permissions": ["personnel.read"],
     "createdAt": "2026-02-21T15:00:00.000Z",
     "lastLogin": "2026-02-21T15:00:00.000Z"
   }
   ```

2. **Roles and Permissions**:
   - **Admin**: Full access (all permissions)
   - **Medical**: Create/update personnel, view analytics
   - **Viewer**: Read-only personnel access, can upload medical results

### Changing User Roles

Update the `role` field in Firestore `users` collection. Permissions will be automatically updated on next login.

---

## 🧪 Testing

### Backend Testing

```bash
cd server
npm test  # Run tests (if configured)
npm run dev  # Test locally
```

### Frontend Testing

```bash
cd client
npm start  # Test locally
npm run build  # Test production build
```

### Integration Testing

1. Start backend: `cd server && npm run dev`
2. Start frontend: `cd client && npm start`
3. Test all features:
   - ✅ Login with Google
   - ✅ Create personnel record
   - ✅ Update personnel record
   - ✅ Upload medical result
   - ✅ View analytics
   - ✅ Check activity log
   - ✅ Logout

---

## 📈 Monitoring and Maintenance

### Cloud Logging (Google Cloud)

```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50

# Stream logs in real-time
gcloud logging tail "resource.type=cloud_run_revision"
```

### Firebase Console Monitoring

1. **Authentication**: Monitor user logins
2. **Firestore**: Check database usage
3. **Storage**: Monitor storage usage (when migrated)
4. **Performance**: Track page load times

### Regular Maintenance Tasks

- **Weekly**: Review activity logs for suspicious activity
- **Monthly**: Update dependencies, review security
- **Quarterly**: Security audit, penetration testing

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "CORS Error" in browser
- **Solution**: Update `CORS_ORIGIN` in server `.env` to match frontend domain

#### 2. "Firebase Admin SDK error"
- **Solution**: Check `FIREBASE_PRIVATE_KEY` format (must have `\n` for newlines)

#### 3. "Activity logs not appearing"
- **Solution**: Check server logs for errors, verify Firestore rules allow read access

#### 4. "File upload fails"
- **Solution**: Ensure file is under 500KB, check file format (JPEG, PNG, GIF, PDF only)

#### 5. "JWT token expired"
- **Solution**: User needs to login again (24-hour expiration)

---

## 📞 Support

For technical support:
- Check `SECURITY.md` for security guidelines
- Review server logs for errors
- Check Firebase Console for service status
- Contact: IT Department / System Administrator

---

## 🎯 Next Steps (Optional Enhancements)

1. **Migrate to Firebase Storage** for larger file support
2. **Add email notifications** for personnel updates
3. **Implement batch operations** for bulk personnel imports
4. **Add export functionality** (CSV/Excel)
5. **Mobile responsive optimizations**
6. **Real-time updates** with Firestore listeners
7. **Advanced analytics** with charts and trends
8. **Audit trail reports** for compliance
9. **Multi-language support** (English/Filipino)
10. **Dark mode** UI option

---

## ✅ Deployment Verification

After deployment, verify:

- [ ] Backend API health check: `https://your-api.run.app/api/health`
- [ ] Frontend loads correctly
- [ ] Google Sign-In works
- [ ] Can create personnel record
- [ ] Can update personnel record
- [ ] Analytics dashboard displays data
- [ ] Activity log shows recent actions
- [ ] Medical results upload works
- [ ] Role-based access control works
- [ ] Security rules are active

---

**Congratulations! Your Philippine Coast Guard Personnel Management System is ready for deployment! 🎉**
