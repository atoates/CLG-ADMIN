# Backend CORS Setup for CLG-ADMIN

## Required Changes to CLG-DEPLOY

To allow your admin dashboard to communicate with the backend API, you need to configure CORS (Cross-Origin Resource Sharing).

### 1. Install CORS Package

In `CLG-DEPLOY` directory:

```bash
npm install cors
```

### 2. Update server.js

Add CORS middleware near the top of `server.js` (after requiring express, before routes):

```javascript
const cors = require('cors');

// CORS configuration for admin dashboard
const allowedOrigins = [
  'http://localhost:5173',  // Local development
  'http://localhost:3001',  // Alternative local port
  process.env.ADMIN_DASHBOARD_URL,  // Production admin dashboard
  process.env.STAGING_ADMIN_URL,    // Staging admin dashboard
].filter(Boolean);  // Remove any undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Admin-Token',
    'X-Requested-With'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400  // 24 hours
}));

// Handle preflight requests
app.options('*', cors());
```

### 3. Set Environment Variables in Railway

For CLG-DEPLOY service in Railway, add these environment variables:

**Production:**
```
ADMIN_DASHBOARD_URL=https://your-admin-dashboard.up.railway.app
```

**Staging (focused-cooperation):**
```
STAGING_ADMIN_URL=https://your-staging-admin.up.railway.app
```

### 4. Update package.json

Ensure `cors` is in dependencies:

```json
{
  "dependencies": {
    "cors": "^2.8.5",
    // ... other dependencies
  }
}
```

### 5. Deploy Backend

```bash
git add package.json package-lock.json server.js
git commit -m "Add CORS support for admin dashboard"
git push
```

Railway will automatically redeploy CLG-DEPLOY.

## Testing CORS

### Test from Browser Console

On your admin dashboard, open DevTools console and run:

```javascript
fetch('https://app.crypto-lifeguard.com/api/alerts', {
  headers: {
    'Authorization': 'Bearer your-token-here'
  }
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

If CORS is working, you'll see the alerts data. If not, you'll see a CORS error.

### Check Network Tab

1. Open DevTools → Network tab
2. Navigate to any admin dashboard page
3. Look for API requests
4. Click on a request
5. Check **Response Headers** for:
   - `Access-Control-Allow-Origin: https://your-admin-url.com`
   - `Access-Control-Allow-Credentials: true`

## Common Issues

### Issue: "No 'Access-Control-Allow-Origin' header"
**Solution:** Backend CORS not configured. Follow steps above.

### Issue: "The CORS protocol does not allow specifying a wildcard"
**Solution:** Don't use `credentials: true` with `origin: '*'`. Use specific origins.

### Issue: Preflight request fails (OPTIONS)
**Solution:** Ensure `app.options('*', cors())` is added before routes.

### Issue: Works locally but not in production
**Solution:** 
- Verify `ADMIN_DASHBOARD_URL` env var is set in Railway
- Check that URL matches exactly (no trailing slash)
- Ensure SSL certificate is valid (https)

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never use `origin: '*'` with credentials** - This is a security risk
2. **Always validate admin tokens** - CORS doesn't prevent unauthorized access
3. **Use HTTPS in production** - Prevents man-in-the-middle attacks
4. **Keep admin dashboard URL private** - Don't expose it publicly
5. **Monitor CORS logs** - Watch for unusual origin requests

## Alternative: Proxy Approach

If you don't want to modify backend CORS, you can use a reverse proxy:

```javascript
// In CLG-ADMIN vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://app.crypto-lifeguard.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      '/admin': {
        target: 'https://app.crypto-lifeguard.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/admin/, '/admin')
      }
    }
  }
})
```

**Note:** This only works in development, not production.

## Verification Checklist

- [ ] `cors` package installed in backend
- [ ] CORS middleware added to server.js
- [ ] Environment variables set in Railway
- [ ] Backend redeployed
- [ ] Admin dashboard can fetch data
- [ ] No CORS errors in browser console
- [ ] Authorization header is sent and received
- [ ] Network tab shows proper CORS headers

## Next Steps

After CORS is configured:

1. Deploy admin dashboard to Railway
2. Set `VITE_API_URL` to production backend
3. Test login and all features
4. Monitor logs for any CORS issues
