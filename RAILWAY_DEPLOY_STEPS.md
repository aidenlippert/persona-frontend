# RAILWAY DEPLOYMENT STEPS

## Step 1: Deploy Backend

1. In Railway, click "+ New" → "Empty Service"
2. Go to Settings → Source → Connect Repo
3. Select your `aidenlippert/persona-frontend` repo
4. Set Root Directory to: `railway-backend`
5. Deploy

## Step 2: Get Backend URL

After backend deploys, you'll get a URL like:
`https://railway-backend-production-abc123.up.railway.app`

## Step 3: Update Frontend Environment Variables

In your frontend service (the one you're looking at):

1. Go to Variables tab
2. Update these variables:

```
VITE_API_BASE_URL = https://your-backend-url-from-step-2.up.railway.app
VITE_FAUCET_BASE_URL = https://your-backend-url-from-step-2.up.railway.app
```

3. Redeploy frontend

## Step 4: Test

Your app should now work! The backend will be publicly accessible and your frontend will connect to it.

## Alternative: Use existing backend

If you want to test immediately:
1. Set `VITE_API_BASE_URL = http://localhost:1317` 
2. Run backend locally: `go run cmd/testnet-daemon/main.go`
3. Use tunneling service like ngrok to expose it publicly