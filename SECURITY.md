# Security Configuration Guide

This document outlines the security configuration for the Philippine Coast Guard Personnel Management System.

## Firestore Security Rules

The system uses Firestore security rules to protect data access at the database level. These rules are defined in `firestore.rules`.

### Key Security Principles

1. **Authentication Required**: All operations require user authentication
2. **Role-Based Access Control (RBAC)**: Permissions are granted based on user roles
3. **Server-Side Activity Logging**: Activity logs can only be created by the server, not clients
4. **Principle of Least Privilege**: Users only have access to what they need

### Rule Breakdown

#### Users Collection
- Users can read their own profile
- Admins can read all user profiles
- Users can only update their own `lastLogin` timestamp
- Only admins can create, update, or delete users

#### Personnel Collection
- All authenticated users can read personnel records
- Create requires `personnel.create` permission
- Update requires `personnel.update` permission
- Delete requires `personnel.delete` permission

#### Activity Log Collection
- All authenticated users can read activity logs
- Only server-side code can write activity logs (prevents client tampering)

### Deploying Firestore Rules

```bash
# Deploy to Firebase
firebase deploy --only firestore:rules

# Test rules locally
firebase emulators:start --only firestore
```

## Firebase Storage Security Rules

The system uses Storage security rules to protect file access. These rules are defined in `storage.rules`.

### Storage Paths

1. **Profile Photos**: `/personnel-photos/{personnelId}/{fileName}`
   - Accepted: Images only (JPEG, PNG, GIF)
   - Max size: 5MB
   - Read: All authenticated users
   - Write/Delete: All authenticated users

2. **Medical Results**: `/medical-results/{personnelId}/step{stepNumber}/{fileName}`
   - Accepted: Images and PDFs
   - Max size: 5MB
   - Read: All authenticated users
   - Write/Delete: All authenticated users

### Deploying Storage Rules

```bash
# Deploy to Firebase
firebase deploy --only storage:rules
```

## User Roles and Permissions

### Admin Role
- Full system access
- Can manage all personnel records
- Can view analytics and activity logs
- Permissions: All (`*`)

### Medical Role
- Can create and update personnel records
- Can view analytics and activity logs
- Cannot delete personnel
- Permissions:
  - `personnel.create`
  - `personnel.update`
  - `personnel.read`

### Viewer Role
- Read-only access to personnel records
- Can upload medical results for completed steps
- Cannot view analytics or activity logs
- Cannot modify personnel records
- Permissions:
  - `personnel.read`

## Server-Side Security

### JWT Authentication
- All API requests require a valid JWT token
- Tokens are signed with `JWT_SECRET` environment variable
- Tokens expire after 24 hours (configurable via `JWT_EXPIRE`)
- Token payload includes: uid, email, role, permissions

### Authentication Middleware
Located in `server/src/middleware/auth.middleware.ts`:
- Verifies JWT token on each request
- Attaches user info to request object
- Returns 401 for invalid/expired tokens

### Permission Middleware
- `requirePermission(permission)`: Checks if user has specific permission
- `requireRole(...roles)`: Checks if user has one of the specified roles

### API Security Best Practices

1. **Always validate input**: Use Zod schemas for request validation
2. **Never trust client data**: Validate and sanitize all inputs
3. **Use prepared statements**: Firestore handles this automatically
4. **Log all actions**: Activity logging is implemented for audit trails
5. **Rate limiting**: Consider implementing rate limiting for production
6. **CORS configuration**: Configure CORS_ORIGIN environment variable

## Environment Variables

### Required Security Variables

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=24h

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# CORS
CORS_ORIGIN=https://your-production-domain.com
```

### Security Checklist for Production

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Set `CORS_ORIGIN` to your production domain
- [ ] Deploy Firestore security rules
- [ ] Deploy Storage security rules
- [ ] Enable Firebase App Check
- [ ] Set up Firebase monitoring and alerts
- [ ] Implement rate limiting on API endpoints
- [ ] Enable HTTPS only (Cloud Run does this by default)
- [ ] Set up Cloud Armor for DDoS protection
- [ ] Regular security audits and updates
- [ ] Implement backup and recovery procedures
- [ ] Set up logging and monitoring (Cloud Logging)
- [ ] Configure Firebase Authentication settings
- [ ] Review and minimize IAM permissions

## Incident Response

### If Security Breach Detected

1. **Immediate Actions**:
   - Revoke all active JWT tokens (change JWT_SECRET)
   - Disable affected user accounts
   - Review activity logs for unauthorized access
   - Block suspicious IP addresses

2. **Investigation**:
   - Check Cloud Logging for suspicious activity
   - Review Firestore audit logs
   - Identify breach scope and affected data
   - Document findings

3. **Remediation**:
   - Patch vulnerability
   - Update security rules if needed
   - Notify affected users
   - Implement additional security measures
   - Update incident response procedures

## Regular Maintenance

### Weekly
- Review activity logs for suspicious patterns
- Monitor failed authentication attempts
- Check for outdated dependencies

### Monthly
- Review and update security rules
- Audit user permissions and roles
- Test backup and recovery procedures
- Update dependencies and security patches

### Quarterly
- Comprehensive security audit
- Penetration testing
- Review and update security documentation
- Train team on security best practices

## Contact

For security concerns or to report vulnerabilities:
- Email: security@coastguard.gov.ph (update this)
- Emergency: Contact system administrator immediately

**Remember**: Security is everyone's responsibility. Always follow the principle of least privilege and never share credentials.
