# UPDATE BACKEND URL AFTER RAILWAY DEPLOYMENT

1. After Railway deployment, you'll get a URL like:
   `https://your-project-name.up.railway.app`

2. Update .env.production with your actual Railway URL:
   ```
   VITE_API_BASE_URL=https://your-actual-railway-url.up.railway.app
   VITE_FAUCET_BASE_URL=https://your-actual-railway-url.up.railway.app
   ```

3. Commit and push:
   ```bash
   git add .env.production
   git commit -m "Update production backend URL"
   git push origin main
   ```

4. Your app will automatically redeploy on Vercel with the correct backend URL!

## Alternative: Deploy to other services

- **Heroku**: Create new app, connect GitHub repo, set buildpack to Go, set source directory to railway-backend
- **DigitalOcean**: Create droplet, copy railway-backend files, run `go run main.go`
- **Render**: Connect GitHub, set build command `cd railway-backend && go build -o main`, start command `./main`