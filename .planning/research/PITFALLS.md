# Common Deployment Pitfalls

## localStorage to Supabase Migration

### Warning Signs
- Data loss on page refresh
- Performance degradation with large data
- Sync issues across browser sessions

### Key Pitfalls
- **Sudden Data Loss**: Migration may lose existing localStorage data
- **Performance Drop**: Network requests for previously instant data
- **Offline Loss**: Supabase requires internet connection

### Prevention
```typescript
// Create storage abstraction layer
interface StorageService {
  getConsultations(): Promise<Consultation[]>;
  saveConsultation(c: Consultation): Promise<void>;
}

// Implement migration script on first load
const migrateFromLocalStorage = async () => {
  const localData = localStorage.getItem('consultations');
  if (localData) {
    await importToSupabase(JSON.parse(localData));
    localStorage.removeItem('consultations');
  }
};
```

## CORS Issues with Vercel + Supabase

### Warning Signs
- "Cross-origin request blocked" errors
- Auth failing in production only

### Prevention
```typescript
// Configure Supabase CORS in dashboard
// Add your Vercel domains:
https://your-app.vercel.app
https://*.vercel.app
```

## Database Migration

### Warning Signs
- Schema mismatch between environments
- Migration failures during deployment

### Prevention
- Use Supabase CLI for consistent migrations
- Test in staging environment first
- Backup before migration

## API Key Security

### Warning Signs
- API keys visible in browser console
- Hardcoded keys in code

### Prevention
```typescript
// ✅ Correct: Use environment variables
const apiKey = import.meta.env.VITE_ZHIPU_API_KEY;

// ❌ Wrong: Never hardcode
const apiKey = "sk-xxx";
```

### Vercel Sensitive Variables
- Mark API keys as "sensitive" in Vercel dashboard
- Never commit `.env` files

## Hot-Reload Issues with Vite

### Warning Signs
- Hot reload not working after Supabase integration
- Environment variables not updating

### Prevention
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    hmr: {
      protocol: 'ws',
      host: 'localhost'
    }
  }
})
```

## Build vs Environment Confusion

### Warning Signs
- Different behavior between dev and production
- Environment-specific features broken

### Prevention
```typescript
// ✅ Correct environment detection
const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

// ❌ Wrong
const isDev = process.env.NODE_ENV === 'development';
```

## Testing Before Production

### Recommended Testing Order

1. **Unit Tests**: Individual functions (80%+ coverage)
2. **Integration Tests**: API calls with mocks
3. **E2E Tests**: Complete user workflows
4. **Performance Tests**: Load times, vector search
5. **Security Tests**: CORS, auth, data validation

### Pre-Production Checklist
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Manual E2E testing complete
- [ ] Performance acceptable
- [ ] Security audit passed
- [ ] Backup plan tested

## Phase-by-Phase Implementation

### Phase 1: Foundation (Setup)
- Set up Supabase project
- Configure database schema
- Implement auth flow
- Set up Vercel project

### Phase 2: Data Migration
- Create storage abstraction layer
- Implement migration script
- Test data import
- Verify data integrity

### Phase 3: Integration
- Replace localStorage with Supabase
- Implement audio upload to Storage
- Add vector search with pgvector
- Test all features

### Phase 4: Production Prep
- Fix build warnings (favicon, Tailwind)
- Optimize bundle size
- Configure environment variables
- Set up monitoring

### Phase 5: Deploy
- Deploy to staging
- Final testing
- Deploy to production
- Monitor and fix issues

## Key Recommendations

1. **Start Fresh**: For new single-user app, consider fresh start
2. **Test Early**: Test CORS and env vars during development
3. **Monitor Performance**: Watch vector search performance
4. **Security First**: Use proper env var setup
5. **Have Rollback Plan**: Keep localStorage fallback initially
