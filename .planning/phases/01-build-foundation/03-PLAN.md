---
wave: 2
depends_on:
  - 01-PLAN.md
  - 02-PLAN.md
files_modified:
  - vite.config.ts
  - vercel.json
  - .gitignore
autonomous: false
---

# Plan 01-03: Vite Config Optimization & Verification

## Goal
Optimize Vite configuration for Vercel deployment and verify the entire build works without console errors.

## Success Criteria
1. vite.config.ts has Vercel-optimized settings (base path, build output)
2. vercel.json configures correct build command and output directory
3. .gitignore excludes production artifacts
4. Application builds without warnings or errors
5. No console errors on application startup (BUILD-08)
6. Production preview runs correctly

## Tasks

### Task 1: Update vite.config.ts
Update `vite.config.ts` with Vercel-optimized settings:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',  // Use relative paths for Vercel compatibility
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'd3': ['d3'],
        }
      }
    }
  },
  server: {
    port: 3000,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost'
    }
  }
})
```

### Task 2: Create vercel.json
Create `vercel.json` in project root:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Task 3: Update .gitignore
Update `.gitignore` to exclude production artifacts and include proper patterns:

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Build output
dist/
dist-ssr/
*.local

# Environment
.env
.env.local
.env.production.local

# Editor
.vscode/*
!.vscode/extensions.json
.idea

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# OS
.DS_Store
*.swp
*.swo

# Testing
coverage/

# Temporary files
*.tmp
*.temp
```

### Task 4: Human Verification Checkpoint
**HUMAN VERIFICATION REQUIRED**

Execute this verification checklist:

1. **Clean build test:**
   ```bash
   rm -rf node_modules dist
   npm install
   npm run build
   ```
   Expected: Build completes with 0 errors, 0 warnings

2. **Development mode check:**
   ```bash
   npm run dev
   ```
   Expected: App starts on localhost:3000, no console errors

3. **Production preview check:**
   ```bash
   npm run preview
   ```
   Expected: Preview app loads correctly, all views work

4. **Console verification:**
   - Open browser DevTools Console
   - Navigate through all views (Upload, Search, Analytics, Graph)
   - Expected: No 404 errors for favicon, no backend API 404s (expected if backend not running), no Tailwind CDN warnings

5. **Build inspection:**
   ```bash
   ls -la dist/
   ```
   Expected: Contains index.html, assets/, favicon.ico, no /index.css (should be bundled)

## Pass/Fail Decision
- **PASS** if: All 5 checks pass with no blocking issues
- **FAIL** if: Any build errors, console errors, or broken functionality
- **WARN** if: Non-blocking issues (e.g., optional backend 404s) - document and proceed

## Implementation Notes
- Addresses BUILD-07 and BUILD-08
- Depends on Wave 1 completion (Tailwind migration + favicon)
- Includes human checkpoint to verify everything works together
- If verification fails, diagnose and fix before marking complete

## Rollback Plan
If issues arise, revert vite.config.ts changes and use default Vite config. The app was working before, so we can always fall back to the previous configuration.
