# Synthesis Log (Static Web App)

A rotating 4‑stage idea synthesis dial powered by a simple CSV term bank.

### Features

- Rotating dial UI  
- Term bank loader  
- AI suggestion button (plugs into your serverless proxy)  
- Import/export JSON log  
- No backend required for UI  
- Deploys cleanly to GitHub Pages

### Deployment (GitHub Pages)

1. Create a repo.
2. Upload all files.
3. Go to Settings → Pages → Set branch: **main**, folder: **root**.
4. Done.

### AI Proxy

Use the included `api/ai-proxy.js` (or similar) in Vercel/Netlify.

Never expose your API key in frontend code.
