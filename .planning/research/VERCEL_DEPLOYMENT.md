# Vercel Deployment Research

## Optimal Vite Config for Vercel

### vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',  // Critical for Vercel
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ai: ['@google/genai'],
          d3: ['d3']
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true
  }
})
```

## Environment Variables in Vercel

### Variable Prefix Convention
- **Client-side**: Prefix with `VITE_`
- Add via Vercel dashboard → Settings → Environment Variables

### Required Variables
```bash
VITE_ZHIPU_API_KEY=your_key
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Access Pattern
```typescript
const apiKey = import.meta.env.VITE_ZHIPU_API_KEY
```

## Tailwind CSS Production Build

### Fix CDN Warning

#### 1. Install Dependencies
```bash
npm install -D tailwindcss postcss autoprefixer @tailwindcss/postcss
```

#### 2. Create tailwind.config.js
```js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
}
```

#### 3. Create postcss.config.js
```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

#### 4. Create src/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

#### 5. Update index.html
```html
<!-- Remove CDN script -->
<!-- Add CSS import -->
<link rel="stylesheet" href="/src/index.css">
```

## vercel.json Configuration

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",

  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

## Supabase + Vercel CORS

### Supabase Configuration
Add to Supabase dashboard → Project Settings → Configuration:
```
https://your-app.vercel.app
https://your-app-git-branch.vercel.app
```

## Deployment Workflow

### Git-Based (Recommended)
1. Connect GitHub repo to Vercel
2. Every push to main → production deployment
3. Pull requests → preview deployments

### CLI-Based
```bash
npm i -g vercel
vercel login
vercel --prod
```

## Common Deployment Gotchas

### 1. Build Failures
**Issue**: "No Output Directory named 'dist'"
**Fix**: Verify `npm run build` creates `dist/`

### 2. Environment Variables Not Working
**Fix**: Use `VITE_` prefix, restart deployment after adding

### 3. Tailwind Not Working
**Fix**: Use local build, not CDN

### 4. Path Issues
**Fix**: Ensure `base: './'` in vite.config.ts

### 5. Bundle Size
**Fix**: Implement code splitting with React.lazy()

## Pre-deployment Checklist

- [ ] Run `npm run build` successfully
- [ ] Test with `npm run preview`
- [ ] Verify environment variables
- [ ] Check all routes work
- [ ] Test with production data

## Sources
- [Vercel Vite Guide](https://vercel.com/docs/frameworks/frontend/vite)
- [Environment Variables](https://vite.dev/guide/env-and-mode)
- [Tailwind v4 PostCSS](https://github.com/tailwindlabs/tailwindcss/issues/15278)
