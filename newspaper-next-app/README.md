# Newspaper CMS Project

This project is a Newspaper CMS built with Next.js, TypeScript, Tailwind CSS, MongoDB, and NextAuth.js.

## Prerequisites

- Node.js (version specified in `.nvmrc` or latest LTS)
- npm or yarn
- MongoDB instance running

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd newspaper-next-app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Set up environment variables:**
    Copy `.env.local.example` to `.env.local` and fill in the required values:
    ```bash
    cp .env.local.example .env.local
    ```
    Update `MONGODB_URI` to point to your MongoDB instance and generate a secure `NEXTAUTH_SECRET`. You can generate a secret using:
    ```bash
    openssl rand -base64 32
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `src/app/`: Main application code (App Router)
  - `api/`: API routes (including NextAuth.js)
  - `lib/`: Utility functions, database connection
  - `components/`: Reusable React components
- `public/`: Static assets
- `models/`: Mongoose schemas (to be created)

## Admin Panel Access

Default admin credentials (defined in NextAuth config, **for development only**):
- Username: `admin`
- Password: `password`

Access the admin panel at (route to be defined, e.g., `/admin`).

## Deployment

This Next.js application can be deployed to any platform that supports Node.js or Next.js hosting (e.g., Vercel, Netlify, AWS, Google Cloud, Azure).

### Build

To create a production build, run:

```bash
npm run build
```

### Environment Variables for Production

Ensure the following environment variables are set in your deployment environment. Copy `.env.local.example` to a production environment file (e.g., managed by your hosting provider) and update the values:

*   `MONGODB_URI`: Connection string for your production MongoDB database.
*   `NEXTAUTH_SECRET`: A strong, unique secret for NextAuth.js. Generate one using `openssl rand -base64 32`.
*   `NEXTAUTH_URL`: The canonical public URL of your deployed application (e.g., `https://www.yourdomain.com`).
*   `R2_BUCKET_NAME`: Your Cloudflare R2 bucket name.
*   `R2_ACCOUNT_ID`: Your Cloudflare account ID.
*   `R2_ACCESS_KEY_ID`: Your R2 access key ID.
*   `R2_SECRET_ACCESS_KEY`: Your R2 secret access key.
*   `R2_PUBLIC_URL_PREFIX`: The public base URL for your R2 bucket (e.g., `https://your-bucket.your-account-id.r2.cloudflarestorage.com` or your custom domain for R2).
*   `NEXT_PUBLIC_SITE_URL`: The canonical public URL of your deployed application (same as `NEXTAUTH_URL`, used for public-facing links, sitemap, etc.).
*   `NEXT_PUBLIC_SITE_NAME`: The name of your website (e.g., "My Awesome Newspaper").

### Recommended Platforms

*   **Vercel**: Offers seamless deployment for Next.js applications, handling builds, CDN, serverless functions, and environment variables automatically.
*   **Netlify**: Similar to Vercel, with strong support for Next.js.

Refer to the platform's documentation for specific deployment instructions.

## Optimization

*   **Image Optimization**: Uses `next/image`. Ensure `R2_PUBLIC_URL_PREFIX` is correctly set for images served from Cloudflare R2 to be optimized. The `next.config.js` is configured to allow this hostname.
*   **Bundle Analysis**: To analyze client-side bundles, run:
    ```bash
    npm run analyze
    ```
    This will open a report in your browser.
*   **Caching & Revalidation**: Public pages (articles, categories, tags) use Incremental Static Regeneration (ISR) with a revalidation period (e.g., 60 seconds) to balance freshness and performance. Search results are fetched dynamically.
