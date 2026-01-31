# Coding Conventions

**Analysis Date:** 2026-01-31

## Naming Patterns

**Files:**
- PascalCase for components: `UploadView.tsx`, `GraphView.tsx`
- camelCase for services: `geminiService.ts`, `backendService.ts`
- lowercase for utilities and helpers
- Use `.tsx` for React components, `.ts` for pure TypeScript

**Functions:**
- camelCase: `getEmbedding`, `transcribeAndSummarize`, `extractClinicalData`
- Exported functions: PascalCase when representing actions or concepts
- Private functions: camelCase prefixed with underscore (e.g., `_validateInput`)

**Variables:**
- camelCase: `consultations`, `isProcessing`, `darkMode`
- Constants: UPPER_SNAKE_CASE: `AI_MODEL`, `GEMINI_API_KEY`
- Parameter names: descriptive and concise (e.g., `consultation`, `language`)

**Types:**
- Interface names: PascalCase with descriptive names: `Consultation`, `ExtractedInfo`
- Type aliases: PascalCase for complex types, camelCase for simple ones
- Enum-like unions: PascalCase: `Language`, `ViewState`

## Code Style

**Formatting:**
- No explicit formatter configured (no prettier/eslintrc found)
- Manual adherence to consistent indentation (2 spaces)
- Semicolons: Present (enforced by TypeScript)
- Quotes: Single quotes in JS/TS, double in JSX

**Linting:**
- No ESLint configuration detected
- TypeScript compiler with strict mode enabled
- Custom patterns enforced through team conventions

## Import Organization

**Order:**
1. External imports first:
```typescript
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
```

2. Relative imports second:
```typescript
import { Consultation, Language } from '../types';
import { transcribeAndSummarize } from '../services/aiService';
```

**Path Aliases:**
- No path aliases configured
- Relative imports only: `../`, `./`, `../../`

**Grouping:**
- Related imports grouped together
- Blank line between import groups

## Error Handling

**Patterns:**
```typescript
// Try-catch for critical errors
try {
  const vector = await getEmbedding(content);
  // ...process vector
} catch (error) {
  console.warn("Embedding generation failed", error);
  // Continue without vector
}

// Async function error handling
export const saveConsultation = async (c: Consultation) => {
  try {
    // ...save logic
  } catch (err) {
    console.error("Critical Save Error:", err);
    alert("Error processing record.");
  }
};
```

**Error Boundaries:**
- No React error boundaries implemented
- Error handling at function level

## Logging

**Framework:** Console logging (no logging library)

**Patterns:**
- console.error() for critical errors: `console.error("Critical Save Error:", err)`
- console.warn() for non-critical issues: `console.warn("Embedding generation failed", e)`
- console.log() for info (limited usage)
- No structured logging

## Comments

**When to Comment:**
- Complex AI prompting logic
- Workarounds for API limitations
- Business logic requirements
- Edge cases in data processing

**JSDoc/TSDoc:**
- No JSDoc comments found in codebase
- Self-documenting code with descriptive variable names
- Inline comments for complex sections

**Example:**
```typescript
// Minimal corpus to save tokens, but include clinical data for better matching
const corpus = consultations.map(c => ({
  id: c.id,
  summary: c.summary,
  diagnosis: c.extractedData?.clinical?.diagnosis || "",
  treatment: c.extractedData?.clinical?.treatment || ""
}));
```

## Function Design

**Size:**
- Average 50-100 lines per function
- Keep functions focused on single responsibility
- Break down complex operations into smaller functions

**Parameters:**
- Prefer 3-5 parameters maximum
- Use interfaces for complex parameter objects
- Optional parameters at the end

**Return Values:**
- Promise-based for async operations
- Specific return types (not any)
- Union types for multiple possible returns

## Module Design

**Exports:**
- Named exports for services and utilities
- Default export for components
- Export interfaces/types for shared use

**Barrel Files:**
- No index.ts barrel files
- Direct imports from source files

**Service Pattern:**
```typescript
// Services are plain TypeScript modules
export const getEmbedding = async (text: string): Promise<number[]> => {
  // ...implementation
};

// No React component mixing
```

## Component Patterns

**Function Components:**
```typescript
const UploadView: React.FC<UploadViewProps> = ({ onSave, language, setIsProcessing }) => {
  // ...implementation
};
```

**Props:**
- Interface for props: `UploadViewProps`
- Destructuring in parameters
- Optional props marked with `?`

**State Management:**
- Local useState for component state
- No global state management
- Prop drilling for state sharing

## TypeScript Patterns

**Strict Mode:**
- Enabled in tsconfig.json
- No `any` types (found rare cases)
- Explicit return types

**Null Safety:**
- Optional chaining: `c.extractedData?.clinical?.diagnosis`
- Null checks: `if (!text) throw new Error("No response")`
- Default values: `|| ""`

**Generics:**
- Limited use, mostly in service interfaces
- Type inference used when possible

---

*Convention analysis: 2026-01-31*
