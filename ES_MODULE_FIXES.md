# ES Module Compatibility Fixes Documentation

This document outlines the ES Module compatibility fixes implemented in the SSH Manager Electron application to resolve issues such as "__dirname is not defined".

## Issues Addressed

1. **`__dirname` and `__filename` not defined in ES Modules**
2. **CommonJS/ES Module interoperability**
3. **Static vs. dynamic imports in Electron environment**

## Solutions Implemented

### 1. Polyfilling `__dirname` and `__filename`

In `electron/main.ts`, we've added proper polyfills at the top of the file:

```typescript
import { fileURLToPath } from 'url';
import path from 'path';

// ES module polyfills for __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

This allows us to use `__dirname` and `__filename` throughout the Electron main process as we would in CommonJS modules.

### 2. Module Configuration

The `tsconfig.electron.json` is properly configured for ES modules:

```json
{
    "compilerOptions": {
        "module": "ES2022",
        "target": "ES2022",
        // ... other options
    }
}
```

And `package.json` correctly specifies ES modules:

```json
{
  "type": "module",
  // ... other configurations
}
```

### 3. Handling Conditional Imports

For optional dependencies like `electron-squirrel-startup` (needed only on Windows), we've commented out the static import and noted how to implement it with dynamic imports if needed:

```typescript
// Commented out for ES module compatibility - re-enable with dynamic import if needed
// if ((await import('electron-squirrel-startup')).default) {
//   app.quit();
// }
```

### 4. File Extensions in Imports

All imports in the Electron files use explicit file extensions (`.js`):

```typescript
import { setupDialogHandlers } from './dialogs.js';
```

## Best Practices for ES Module Compatibility

1. **Always use polyfills** for `__dirname` and `__filename` when migrating to ES modules
2. **Use explicit file extensions** in import statements
3. **Prefer static imports** over dynamic imports when possible for better tree-shaking
4. **Handle platform-specific imports** conditionally with dynamic imports when needed
5. **Configure TypeScript correctly** with `"module": "ES2022"` and `"moduleResolution": "node"`

## Validation

Both builds are working correctly:
- `npm run build:electron` - Compiles the Electron main process
- `npm run build` - Full application build (renderer + main process)

These successful builds confirm that all ES Module compatibility issues have been properly resolved.