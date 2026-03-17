# ✅ Railway Deployment Checklist

## Pre-Deployment

- [x] Railway CLI installed (`npm install -g @railway/cli`)
- [x] Project configured for Railway
- [x] Environment variables template ready
- [x] Deployment scripts created

---

## Deployment Steps

### 1. Login to Railway
```bash
railway login
```
- [ ] Browser opened
- [ ] Logged in successfully
- [ ] Terminal shows "Logged in as [your-email]"

---

### 2. Initialize Project
```bash
railway init
```
- [ ] Selected "Create a new project"
- [ ] Named project (e.g., "smart-metaverse")
- [ ] Project created successfully

---

### 3. Deploy Application
```bash
railway up
```
- [ ] Files uploaded (~3-5 minutes)
- [ ] Build started
- [ ] Build completed
- [ ] Deployment successful

---

### 4. Configure Environment Variables

```bash
railway open
```

In Railway Dashboard:
- [ ] Clicked "Variables" tab
- [ ] Clicked "Raw Editor"
- [ ] Copied content from `.env.production.template`
- [ ] Pasted to Raw Editor
- [ ] Changed `JWT_SECRET` to random string
- [ ] Clicked "Deploy"
- [ ] Waited for redeploy (~2-3 minutes)

---

### 5. Generate Domain

In Railway Dashboard:
- [ ] Clicked "Settings" tab
- [ ] Scrolled to "Domains" section
- [ ] Clicked "Generate Domain"
- [ ] Copied production URL

---

### 6. Test Application

Open production URL in browser:
- [ ] Page loads successfully
- [ ] Clicked "Sign Up"
- [ ] Created new account
- [ ] Logged in successfully
- [ ] Created new game
- [ ] Played game
- [ ] All features working

---

## Post-Deployment

- [ ] Saved production URL
- [ ] Tested on mobile browser
- [ ] Checked browser console for errors
- [ ] Verified Firebase Realtime Database connection
- [ ] Shared URL with team/users

---

## Troubleshooting (If Needed)

If something fails:

### Build Failed
```bash
railway logs
```
- [ ] Checked build logs
- [ ] Fixed errors
- [ ] Redeployed: `railway up`

### Login Not Working
- [ ] Verified environment variables are set
- [ ] Waited 2-3 minutes after setting variables
- [ ] Checked browser console (F12)
- [ ] Checked Network tab for API errors

### Database Connection Failed
- [ ] Verified `FIREBASE_DB_URL` is correct
- [ ] Verified `FIREBASE_AUTH_SECRET` is correct
- [ ] Checked Firebase Realtime Database rules

---

## Success Criteria

✅ All checkboxes above are checked  
✅ Production URL is accessible  
✅ Users can signup/login  
✅ Users can create and play games  
✅ No errors in browser console  
✅ No errors in Railway logs  

---

## 🎉 Deployment Complete!

**Production URL:** _____________________________________

**Deployed on:** _____________________________________

**Notes:** 
_____________________________________________________
_____________________________________________________
_____________________________________________________
