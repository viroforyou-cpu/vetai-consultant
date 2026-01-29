# Coding Conventions

**Analysis Date:** 2024-11-29

## Naming Patterns

**Files:**
- PascalCase for components (e.g., `UploadView.tsx`, `SearchView.tsx`)
- camelCase for services (e.g., `geminiService.ts`, `qdrantService.ts`)
- kebab-case for configuration (e.g., `vite.config.ts`)

**Functions:**
- camelCase for both component functions and utility functions
- async functions prefix with `async` keyword
- exported functions use camelCase (e.g., `getEmbedding`, `transcribeAndSummarize`)

**Variables:**
- camelCase for local variables (e.g., `vetName`, `patientName`, `transcription`)
- boolean flags use descriptive names (e.g., `isProcessing`, `darkMode`)
- array variables use plural names when appropriate (e.g., `consultations`, `results`)

**Types:**
- PascalCase for interfaces (e.g., `Consultation`, `ExtractedInfo`)
- PascalCase for enums (e.g., `Species`)
- TypeScript interfaces define object shapes
- Optional fields marked with `?`

## Code Style

**Formatting:**
- Indentation: 4 spaces
- No trailing whitespace
- Semicolons at end of statements (not enforced, but observed)
- Line length: ~100 characters (though longer lines exist)

**Linting:**
- No formal ESLint configuration detected
- TypeScript provides type checking via `tsc`
- Code style varies between components and services

**TypeScript:**
- Strict TypeScript usage
- No `any` types observed (except in React component props)
- Proper typing for function parameters and returns
- Interface definitions in `types.ts`

## Import Organization

**Order:**
1. React imports first
2. Relative service imports
3. Relative component imports
4. Third-party library imports

**Path Aliases:**
- No path aliases configured
- Relative imports used throughout (e.g., `../services/geminiService`)

**Import Patterns:**
```typescript
import React, { useState } from 'react';
import { Consultation } from '../types';
import { getEmbedding } from '../services/geminiService';
```

## Error Handling

**Patterns:**
- try/catch blocks for async operations
- console.error for logging errors
- Graceful fallbacks for external service failures
- Error messages displayed to user via alerts or status updates

**Service Error Handling:**
```typescript
try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Backend error: ${response.status}`);
} catch (error) {
    console.error("Save Consultation Error:", error);
    // Silent fallback - don't break UI
}
```

**Component Error Handling:**
- User feedback via status messages
- Loading states during async operations
- Error states displayed to users

## Logging

**Framework:** console.log and console.error

**Patterns:**
- Error logging with descriptive messages
- Warning messages for non-critical failures
- Debug logging for API calls (e.g., "Qdrant is not reachable")
- No structured logging framework

## Comments

**When to Comment:**
- Complex AI prompts and prompts
- Fallback logic explanations
- Non-obvious business logic
- API call retry logic

**TSDoc Usage:**
- Limited TSDoc usage
- Comments mainly in service files for complex logic
- No formal documentation generation

## Function Design

**Size:**
- Component functions: 100-200 lines
- Service functions: 20-50 lines
- Small, focused functions where possible

**Parameters:**
- Limited parameters per function (typically 2-4)
- Optional parameters rarely used
- Object destructuring for complex props

**Return Values:**
- Services return Promises with proper typing
- Components return JSX elements
- Consistent return types for similar operations

## Module Design

**Exports:**
- Named exports for functions and types
- Default exports for React components
- Barrel files not used

**Services Architecture:**
- Pure TypeScript modules (not React components)
- No shared state between services
- Dependency injection via parameters

**Component Architecture:**
- Functional components with hooks
- No class components detected
- Container/presentational pattern not strictly followed

## React Patterns

**Hooks Usage:**
- useState for state management
- useEffect for side effects
- No custom hooks observed
- No state management libraries

**State Management:**
- Local state in components
- App-level state in App.tsx
- No global state management

**Props Patterns:**
- Object destructuring in component signatures
- Optional props marked with default values
- Type-safe props interfaces

## Styling Patterns

**Tailwind CSS:**
- Class-based styling throughout
- Dark mode via `dark:` prefix
- Responsive utility classes
- Consistent color scheme (teal primary, gray secondary)

## Async Patterns

**Async Functions:**
- async/await pattern throughout
- Promise.all for parallel operations
- No async/await in arrow functions (use async function declaration)
- Proper error handling for async operations

**Loading States:**
- Multiple loading states for better UX
- Optimistic UI updates
- Disabled states during operations

---

*Convention analysis: 2024-11-29*