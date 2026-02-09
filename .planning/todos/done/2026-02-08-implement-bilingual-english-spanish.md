---
created: 2026-02-08T13:20:00Z
title: Implement bilingual support for English and Spanish
area: ui
files:
  - src/App.tsx:14 (Language type and state)
  - src/components/UploadView.tsx:6-7 (language prop)
  - src/components/SearchView.tsx (language support)
  - src/components/AppointmentView.tsx (bilingual implementation example)
  - types.ts:2 (Language type definition)
---

## Problem

The VetAI Consultant application currently has partial bilingual support (English/Spanish) but needs comprehensive implementation across all components. The AppointmentView.tsx component demonstrates good bilingual patterns that should be applied consistently throughout the app.

## Solution

**Approach:**
1. **Audit current language support** - Review each component for bilingual implementation
2. **Create language constants file** - Centralize all English/Spanish text strings
3. **Update components** - Apply bilingual pattern from AppointmentView to:
   - UploadView
   - SearchView
   - GraphView
   - AnalyticsView
4. **Add language toggle in UI** - Prominent language switcher in header/sidebar
5. **Test all views in both languages** - Ensure complete translation coverage

**Reference:** AppointmentView.tsx already implements this pattern well with conditional rendering based on `language` prop:
```tsx
{language === 'es' ? 'Pacientes' : 'Patients'}
```

**Priority:** Medium - Enhances accessibility for Spanish-speaking veterinarians
