# Frontend Deployment Guide - Vercel

This guide will help you deploy the TaDa frontend to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Backend Deployed**: Make sure your backend is deployed and accessible via a public URL
3. **Environment Variables**: You'll need to set up environment variables in Vercel

## Deployment Steps

### 1. Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### 2. Environment Variables

You'll need to set up the following environment variable in Vercel:

- `NEXT_PUBLIC_API_URL`: Your backend API URL (e.g., `https://your-backend-url.com`)

### 3. Deploy via Vercel Website (Recommended)

1. **Connect Repository**:

   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your Git repository
   - Select the `frontend` folder as the root directory

2. **Configure Build Settings**:

   - Framework Preset: `Next.js`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
   - Development Command: `npm run dev`

3. **Set Environment Variables**:

   - In the Vercel dashboard, go to your project settings
   - Navigate to "Environment Variables"
   - Add: `NEXT_PUBLIC_API_URL` with your backend URL

4. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete

### 4. Deploy via CLI (Alternative)

```bash
cd frontend
vercel --prod
```

Follow the prompts to configure your deployment.

## Configuration Files

The following files have been configured for optimal Vercel deployment:

- `next.config.ts`: Optimized for Vercel with compression and image handling
- `vercel.json`: Vercel-specific configuration with security headers
- `.gitignore`: Ensures sensitive files aren't committed

## Important Notes

1. **Backend URL**: Make sure your `NEXT_PUBLIC_API_URL` points to your deployed backend
2. **CORS**: Ensure your backend allows requests from your Vercel domain
3. **Environment Variables**: All public environment variables must start with `NEXT_PUBLIC_`

## Troubleshooting

- **Build Errors**: Check the build logs in Vercel dashboard
- **API Errors**: Verify your backend URL and CORS settings
- **Images Not Loading**: Ensure S3 bucket has proper CORS configuration

## Post-Deployment

After successful deployment:

1. Test all functionality on the live site
2. Update any hardcoded URLs in your code
3. Set up custom domain (optional)
4. Configure analytics (optional)

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Verify environment variables
3. Test backend API endpoints directly
4. Check browser developer console for errors
