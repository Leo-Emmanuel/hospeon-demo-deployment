const isDeployment = process.env.VERCEL || process.env.CI;

if (isDeployment && !process.env.VITE_API_BASE_URL) {
  console.error(
    'Missing VITE_API_BASE_URL. Set it to your Render backend URL, for example https://your-service.onrender.com/api/v1'
  );
  process.exit(1);
}
