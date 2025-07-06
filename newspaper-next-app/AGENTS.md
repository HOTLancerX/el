# AGENT Instructions for Newspaper CMS Project

This document provides specific instructions for AI agents working on this codebase.

## Project Stack

- **Framework:** Next.js (with App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** MongoDB (via Mongoose)
- **Authentication:** NextAuth.js

## Directory Structure & Conventions

- All project code resides within the `newspaper-next-app` directory at the root of the repository.
- **Components:** Reusable UI components should be placed in `newspaper-next-app/src/components/`. Further subdirectories for specific features (e.g., `admin`, `layout-builder`) are encouraged.
- **API Routes:** Server-side API logic is located in `newspaper-next-app/src/app/api/`.
- **Models:** Mongoose schemas should be defined in `newspaper-next-app/src/models/` (e.g., `Article.ts`, `User.ts`, `SiteSetting.ts`). The `SiteSetting.ts` model uses a single-document approach for global site configurations.
- **API Routes:** Server-side API logic is located in `newspaper-next-app/src/app/api/`. This includes `/api/settings` (GET, PUT) for managing site-wide settings.
- **MongoDB Connection:** Use the utility at `newspaper-next-app/src/lib/mongodb/index.ts` to connect to the database.
- **Site Settings Service:** A utility at `newspaper-next-app/src/lib/settingsService.ts` (`getSiteSettings`) is available for fetching site settings server-side, with basic caching and default fallbacks.
- **Environment Variables:** All sensitive information or configuration that varies between environments should be managed through `.env.local`. A `.env.local.example` file tracks required variables (e.g., `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SITE_NAME` are used by the settings system and metadata generation).
- **NextAuth.js:** Configuration is in `newspaper-next-app/src/app/api/auth/[...nextauth]/route.ts`. User session and JWT callbacks are important for managing user roles and session data. Admin role is required for modifying site settings.

## Development Workflow

1.  **Branching:** Create feature branches from `main` or `develop` (if used).
2.  **Commits:** Follow conventional commit message standards.
3.  **Testing:**
    - Write unit tests for components and utility functions.
    - Write integration tests for API routes.
    - Aim for good test coverage.
4.  **Pull Requests:** Ensure all tests pass and linting issues are resolved before submitting a PR.

## Specific Tasks & Considerations

- **Layout Builder:** This is a core feature. Pay attention to the design of the data structure for layouts (likely JSON) and the reusability of widget components.
- **Admin Panel:** Ensure routes under `/admin` are protected and only accessible by authenticated users with appropriate roles.
- **Error Handling:** Implement robust error handling both on the client-side and server-side.
- **TypeScript:** Leverage TypeScript's static typing to improve code quality and catch errors early. Use appropriate types for props, state, and API responses.
- **Site Settings Integration**: When adding features to the public-facing frontend (e.g., headers, footers, specific metadata displays), check the `SiteSetting.ts` model and `settingsService.ts` to see if relevant global settings (like site title, logo, tagline, default images, posts per page) should be used. The admin panel for these settings is at `/admin/settings`.

## Running Commands

- When using tools like `run_in_bash_session`, ensure commands are executed within the `/app/newspaper-next-app` directory. For example:
  ```bash
  (cd /app/newspaper-next-app && npm install some-package)
  ```
  Or, if creating files, ensure the path is correct:
  ```
  create_file_with_block
  newspaper-next-app/src/components/MyComponent.tsx
  // ... content ...
  ```

Remember to always refer to the overall plan and the current step's objectives.
