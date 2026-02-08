---
wave: 1
depends_on: []
files_modified:
  - tailwind.config.js
  - postcss.config.js
  - src/index.css
  - index.html
autonomous: true
---

# Plan 01-01: Tailwind CSS Migration

## Goal
Replace Tailwind CDN dependency with local PostCSS build for production-ready styling.

## Success Criteria
1. Application builds without warnings about Tailwind CDN usage
2. Tailwind styles render correctly across all views (Upload, Search, Analytics, Graph)
3. Production build includes compiled CSS instead of CDN reference
4. Hot-reload continues to work in development mode

## Tasks

<task type="auto">
  <name>Task 0: Verify BUILD-01 dependencies</name>
  <files>package.json</files>
  <action>Verify that Tailwind CSS and PostCSS dependencies are installed. Check package.json for: tailwindcss, postcss, autoprefixer, @tailwindcss/postcss. If any are missing, run: npm install tailwindcss postcss autoprefixer @tailwindcss/postcss --save-dev</action>
  <verify>grep -E "(tailwindcss|postcss|autoprefixer|@tailwindcss/postcss)" package.json | wc -l | grep -q "4"</verify>
  <done>All four Tailwind/PostCSS dependencies present in package.json</done>
</task>

<task type="auto">
  <name>Task 1: Create tailwind.config.js</name>
  <files>tailwind.config.js</files>
  <action>Create `tailwind.config.js` in project root with content paths pointing to all source files:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
}
```</action>
  <verify>test -f tailwind.config.js && grep -q "content:" tailwind.config.js && grep -q "darkMode: 'class'" tailwind.config.js</verify>
  <done>tailwind.config.js exists with content paths and darkMode configured</done>
</task>

<task type="auto">
  <name>Task 2: Create postcss.config.js</name>
  <files>postcss.config.js</files>
  <action>Create `postcss.config.js` in project root with Tailwind and Autoprefixer plugins:

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```</action>
  <verify>test -f postcss.config.js && grep -q "tailwindcss:" postcss.config.js && grep -q "autoprefixer:" postcss.config.js</verify>
  <done>postcss.config.js exists with Tailwind and Autoprefixer plugins configured</done>
</task>

<task type="auto">
  <name>Task 3: Update src/index.css</name>
  <files>src/index.css</files>
  <action>Update `src/index.css` to include Tailwind directives at the top. The file should start with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Keep existing custom styles below the directives.

Note: Vite automatically processes CSS files through PostCSS when postcss.config.js exists, so the @tailwind directives will be compiled during the build.</action>
  <verify>head -5 src/index.css | grep -q "@tailwind base;" && head -10 src/index.css | grep -q "@tailwind utilities;"</verify>
  <done>src/index.css has Tailwind directives at the top and existing styles preserved below</done>
</task>

<task type="auto">
  <name>Task 4: Update index.html</name>
  <files>index.html</files>
  <action>Remove Tailwind CDN script from `index.html`. Delete this line:
```html
<script src="https://cdn.tailwindcss.com"></script>
```

Verify the local CSS link remains:
```html
<link rel="stylesheet" href="/src/index.css">
```</action>
  <verify>! grep -q "cdn.tailwindcss.com" index.html && grep -q 'href="/src/index.css"' index.html</verify>
  <done>index.html has no Tailwind CDN reference and includes local CSS link</done>
</task>

## Verification
<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Complete Tailwind CSS migration from CDN to PostCSS build</what-built>
  <how-to-verify>
    1. Run `npm run dev` - app should load without console warnings about Tailwind CDN
    2. Run `npm run build` - build should complete successfully
    3. Navigate through all views (Upload, Search, Analytics, Graph) - verify proper styling
    4. Test dark mode toggle - should work correctly
  </how-to-verify>
  <resume-signal>Type "approved" if all checks pass, or describe issues found</resume-signal>
</task>

## Implementation Notes
- Research confirms: `tailwindcss`, `postcss`, `autoprefixer`, `@tailwindcss/postcss` are already installed
- BUILD-01 is already satisfied (dependencies exist)
- This plan addresses BUILD-02, BUILD-03, BUILD-04, BUILD-05
