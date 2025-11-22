# API Documentation

This directory contains automatically generated API documentation for the JiffyJobs backend.

## Viewing the Documentation

1. **GitHub Pages (Recommended):**
   - After enabling GitHub Pages, documentation will be available at:
   - `https://priyank-neu.github.io/JiffyJobs/`
   - Or via the repository settings > Pages

2. **Local Viewing:**
   ```bash
   cd backend
   npm run docs:serve
   # Open http://localhost:8080 in your browser
   ```

3. **Raw HTML (GitHub File Viewer):**
   - GitHub displays HTML as raw code, not rendered
   - Click "Raw" button and copy the URL, then use:
   - `https://htmlpreview.github.io/?<raw-url>`
   - Or use: `https://raw.githack.com/priyank-neu/JiffyJobs/feature/api-documentation/docs/index.html`

## Documentation Structure

- **Controllers:** API endpoint handlers
- **Services:** Business logic services
- **Types:** TypeScript type definitions
- **Utilities:** Helper functions and utilities

## Generating Documentation

To regenerate the documentation:

```bash
cd backend
npm run docs:generate
```

The documentation is generated using **TypeDoc**, which extracts JSDoc comments from the source code.

## Documentation Files

- `index.html` - Main documentation entry point
- `classes/` - Class documentation
- `functions/` - Function documentation
- `enums/` - Enumeration documentation

## Documentation Standards

All important classes and methods include JSDoc comments with:
- `@description` - What the function does
- `@param` - Parameter descriptions
- `@returns` - Return value description
- `@throws` - Error conditions
- `@example` - Usage examples

