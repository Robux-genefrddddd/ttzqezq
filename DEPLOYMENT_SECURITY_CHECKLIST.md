# Pre-Deployment Security Checklist

## 🔒 Critical Checks (MUST FIX BEFORE DEPLOYMENT)

### Secrets & Configuration

- [ ] **Remove Firebase config from frontend**
  - [ ] `client/lib/firebase.ts` - Move all secrets to `.env`
  - [ ] No API keys in version control
  - [ ] `.env`, `.env.local` in `.gitignore`
  - [ ] Use environment variables for all secrets

```typescript
// ✅ CORRECT
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  // ...
};

// ❌ WRONG
const firebaseConfig = {
  apiKey: "AIzaSyD7KlxN05OoSCGHwjXhiiYyKF5bOXianLY", // DON'T EXPOSE!
};
```

- [ ] **OpenRouter API Key**
  - [ ] Stored in Firebase Cloud Functions environment variables
  - [ ] Set via: `firebase functions:config:set openrouter.api_key="..."`
  - [ ] Never in frontend code
  - [ ] Never in version control

- [ ] **Cloud Secrets Manager**
  - [ ] Configure Google Cloud Secret Manager for production
  - [ ] Grant Cloud Functions access to secrets
  - [ ] Rotate keys every 90 days

### Firebase Rules

- [ ] **Firestore Security Rules**
  - [ ] Deploy `firestore.rules` from repository
  - [ ] Test rules in Firestore Rules Playground
  - [ ] Verify field-level protection (role, earnings, etc.)
  - [ ] Command: `firebase deploy --only firestore:rules`

- [ ] **Storage Rules**
  - [ ] Deploy `storage.rules` from repository
  - [ ] Verify file size limits (5MB for images)
  - [ ] Verify MIME type restrictions
  - [ ] Command: `firebase deploy --only storage`

- [ ] **Firebase Authentication**
  - [ ] Enable email verification
  - [ ] Set password policy (min 8 chars, complexity)
  - [ ] Configure email templates for verification, password reset
  - [ ] Enable reCAPTCHA v3 for signup (optional but recommended)

### Cloud Functions

- [ ] **Deploy All Cloud Functions**

  ```bash
  firebase deploy --only functions
  ```

  Functions required:
  - [ ] `registerUser` - User registration with validation
  - [ ] `updateUserRole` - Role changes (admin only)
  - [ ] `updateMemberRank` - Member tier changes (admin only)
  - [ ] `banUser` - Ban user account
  - [ ] `unbanUser` - Restore banned user
  - [ ] `onAssetUploaded` - NSFW detection trigger
  - [ ] `scanImageForNSFW` - Manual NSFW scan
  - [ ] `recordAssetDownload` - Download tracking
  - [ ] `checkExpiredBans` - Scheduled job for lifting expired bans

- [ ] **Environment Variables Set**

  ```bash
  firebase functions:config:set \
    openrouter.api_key="sk-..." \
    app.environment="production"
  ```

- [ ] **Test Function Endpoints**
  - [ ] Call each function with valid input
  - [ ] Verify error responses
  - [ ] Check audit logs

### Code Quality

- [ ] **No Console Logging of Secrets**
  - [ ] Search for `console.log(password`, `console.log(email`, `console.log(token`
  - [ ] Remove all `console.log` statements before deployment
  - [ ] Use structured logging instead

- [ ] **TypeScript Strict Mode**
  - [ ] `tsconfig.json` has `"strict": true`
  - [ ] No `any` types in critical code
  - [ ] Run `npm run typecheck`

- [ ] **No Hardcoded Values**
  - [ ] Database IDs not in code
  - [ ] API endpoints configurable via env
  - [ ] Feature flags for beta features

- [ ] **Dependency Audit**
  ```bash
  npm audit
  npm audit fix
  ```

  - [ ] Zero critical vulnerabilities
  - [ ] All dev dependencies up to date

### Input Validation

- [ ] **Server-Side Validation Active**
  - [ ] `server/validation/inputValidation.ts` imported in all route handlers
  - [ ] Username validation enforced
  - [ ] Email validation enforced
  - [ ] Password validation enforced
  - [ ] File size/type validation enforced

- [ ] **No Client-Only Validation**
  - [ ] Client validation is for UX only
  - [ ] Server re-validates all inputs
  - [ ] No trust of client-submitted data

### Rate Limiting

- [ ] **Rate Limiters Configured**
  - [ ] Login: 5 attempts/15min per IP
  - [ ] Signup: 10 accounts/hour per IP
  - [ ] API: 100 requests/minute per IP
  - [ ] Uploads: 20 per hour per user

- [ ] **For Production with High Traffic**
  - [ ] Replace in-memory rate limiter with Redis
  - [ ] Configure Redis connection in env
  - [ ] Test rate limiter under load

### Audit Logging

- [ ] **Audit Collection Created**
  - [ ] Firestore collection: `audit_logs`
  - [ ] Append-only rules applied
  - [ ] Only admins can read

- [ ] **Audit Log to All Admin Operations**
  - [ ] Role changes logged
  - [ ] Ban/unban logged
  - [ ] Asset rejections logged
  - [ ] Warning creations logged

- [ ] **Logging Infrastructure**
  - [ ] Send critical logs to Sentry/DataDog
  - [ ] Configure log retention (90+ days)
  - [ ] Set up alerts for suspicious activity

---

## 🚀 Deployment Steps

### Step 1: Prepare Environment

```bash
# Set environment variables
export FIREBASE_PROJECT_ID="keysystem-d0b86-8df89"
export NODE_ENV="production"

# Create .env.production
cat > .env.production << EOF
REACT_APP_FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
OPENROUTER_API_KEY=<get from password manager>
EOF
```

### Step 2: Build & Test

```bash
# Build the project
npm run build

# Run tests
npm run test

# Type check
npm run typecheck
```

### Step 3: Deploy Firebase

```bash
# Login
firebase login

# Select project
firebase use $FIREBASE_PROJECT_ID

# Deploy Firestore Rules
firebase deploy --only firestore:rules

# Deploy Storage Rules
firebase deploy --only storage

# Deploy Cloud Functions
firebase deploy --only functions

# Deploy everything
firebase deploy
```

### Step 4: Verify Deployment

- [ ] Test signup with new account
- [ ] Verify email verification email received
- [ ] Test login with correct and incorrect password
- [ ] Verify rate limiting (try 6 logins in quick succession)
- [ ] Try uploading an image
- [ ] Verify asset appears in marketplace after NSFW scan
- [ ] Check audit logs in Firestore
- [ ] Try accessing admin operations as regular user (should fail)

### Step 5: Post-Deployment

- [ ] Monitor error logs (Sentry/CloudWatch)
- [ ] Check Firebase usage (billing)
- [ ] Verify database is accepting reads/writes
- [ ] Test download functionality
- [ ] Verify CORS is working correctly

---

## 📋 Ongoing Security Tasks

### Daily

- [ ] Monitor error logs for anomalies
- [ ] Check Firebase storage quota usage
- [ ] Review recent uploads for policy violations

### Weekly

- [ ] Review audit logs for unusual activity
- [ ] Check failed login attempts
- [ ] Verify email verification is working

### Monthly

- [ ] Audit user roles and permissions
- [ ] Review banned users list
- [ ] Check for stale/unused accounts
- [ ] Backup Firestore data

### Quarterly

- [ ] Penetration testing
- [ ] Security review of new features
- [ ] Dependency updates and audits
- [ ] Rotate OpenRouter API key

### Yearly

- [ ] Full security audit
- [ ] Disaster recovery drill
- [ ] Update security policy
- [ ] Review compliance requirements

---

## 🔍 Security Verification Checklist

### API Endpoints

- [ ] All endpoints validate authentication (`request.auth != null`)
- [ ] All endpoints validate authorization (user owns resource, or is admin)
- [ ] All endpoints validate input (type, length, format)
- [ ] All endpoints rate-limited
- [ ] All endpoints log to audit_logs

### Database

- [ ] Firestore Rules prevent unauthorized reads
- [ ] Users can only read/write their own documents
- [ ] Admin/partner roles can't be set by users
- [ ] `earnings`, `assetsCreated`, `downloads` are read-only for users
- [ ] `isBanned` field can only be modified by admins

### File Upload

- [ ] Only images allowed (PNG, JPEG, WebP)
- [ ] Max file size enforced (5MB)
- [ ] NSFW detection runs on every upload
- [ ] Rejected uploads create warnings
- [ ] 3 warnings = auto-ban for 7 days
- [ ] Banned users can't access platform

### Authentication

- [ ] Password reset requires email verification
- [ ] Email verification required for certain actions
- [ ] Password policy enforced (8+ chars, complexity)
- [ ] Failed login attempts logged
- [ ] Login rate-limited

### Admin Features

- [ ] Role changes log to audit_logs
- [ ] Bans log reason and timestamp
- [ ] Only founders can create admins
- [ ] Admin panel requires authentication

---

## 🚨 Emergency Response

### If Security Breach Detected

1. [ ] Take database offline if needed
2. [ ] Disable affected accounts
3. [ ] Rotate API keys
4. [ ] Review audit logs to determine scope
5. [ ] Notify affected users
6. [ ] File incident report
7. [ ] Implement additional safeguards

### If Database Compromise Suspected

1. [ ] Enable Firestore backups immediately
2. [ ] Invalidate all user sessions
3. [ ] Force password reset for all users
4. [ ] Review all recent changes in audit_logs
5. [ ] Restore from known-good backup if available

### If NSFW Content Bypass Discovered

1. [ ] Disable NSFW detection temporarily to test
2. [ ] Check all recently uploaded assets
3. [ ] Quarantine suspect assets
4. [ ] Review OpenRouter API response format
5. [ ] Re-enable with stricter thresholds

---

## Contact & Escalation

**Security Issues:** security@marketplace.com
**Technical Support:** support@marketplace.com
**Emergency Hotline:** +1-XXX-XXX-XXXX
**On-Call Engineer:** Use PagerDuty

---

**Last Updated:** 2024
**Next Review:** Q1 2025
**Approved By:** Security Team
