# Deployment Guide - Smart Attend

This guide provides step-by-step instructions for deploying Smart Attend to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. A GitHub account with the repository pushed
3. Firebase project created and configured
4. All environment variables ready

## Step 1: Prepare Your Repository

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
git remote add origin https://github.com/your-username/smart-attend.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Using Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository from the list
5. Configure the following:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: npm run build
   - **Output Directory**: .next
   - **Install Command**: npm ci

### Step 3: Add Environment Variables

In the Vercel dashboard:

1. Go to **Settings → Environment Variables**
2. Add the following variables (from your Firebase project):
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

3. (Optional) For email notifications, add:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASSWORD`
   - `SMTP_FROM`

### Step 4: Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Once deployed, you'll get a live URL

## Accessing Your Deployed App

Your app will be available at: `https://your-project-name.vercel.app`

## Post-Deployment Steps

### 1. Update Firebase Security Rules

Deploy Firestore security rules:

```bash
firebase login
firebase use your-project-id
firebase deploy --only firestore:rules
```

### 2. Configure Firebase Authentication

In Firebase Console:

1. Go to **Authentication → Settings**
2. Add your Vercel domain to authorized domains:
   - Add: `your-project-name.vercel.app`
   - Add: `your-custom-domain.com` (if applicable)

### 3. Test the Application

1. Visit your deployed URL
2. Create a new account
3. Test the main features:
   - Dashboard view
   - Mark attendance
   - View records
   - Generate reports

## Connecting a Custom Domain

1. In Vercel dashboard, go to **Settings → Domains**
2. Click "Add Domain"
3. Enter your custom domain
4. Follow the DNS configuration instructions
5. Update your Firebase Console:
   - Authentication → Settings → Authorized domains
   - Add your custom domain

## Troubleshooting

### Build Failures

```bash
# Check the build logs in Vercel dashboard
# Common issues:
# 1. Missing environment variables - check all are added
# 2. Node version mismatch - Vercel uses Node 18+ by default
# 3. Firebase credentials invalid - verify in Firebase Console
```

### Firebase Connection Issues

- Verify all environment variables are correctly set
- Check that your Firebase project has Authentication and Firestore enabled
- Ensure Firestore rules allow access from your domain

### Email Notifications Not Sending

- If SMTP is configured, check credentials
- Verify SMTP_HOST and SMTP_PORT are correct
- Check spam folder for test emails

## Performance Optimization

1. **Image Optimization**: Next.js automatically optimizes images
2. **Code Splitting**: Routes are automatically split
3. **Caching**: Configure in vercel.json if needed

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store"
        }
      ]
    }
  ]
}
```

## Monitoring

- Check Vercel Analytics: https://vercel.com/docs/analytics
- Monitor Firebase usage in Firebase Console
- Set up email alerts in Vercel for deployment failures

## Continuous Deployment

Your app automatically redeploys when you push to your GitHub main branch.

To deploy a specific branch, create a new project in Vercel and select that branch.

## Rollback

To rollback to a previous deployment:

1. Go to Vercel dashboard
2. Click on the project
3. Go to **Deployments**
4. Find the deployment you want to revert to
5. Click the three-dots menu and select "Promote to Production"

## Support

For issues:
- Check Vercel documentation: https://vercel.com/docs
- Firebase documentation: https://firebase.google.com/docs
- GitHub issues: Create an issue in your repository

## Example Deployment URL

After deployment, your app will be accessible at:
```
https://smart-attend-{random-string}.vercel.app
```

You can customize this in Vercel project settings.
