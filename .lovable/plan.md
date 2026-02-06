

# Fix Page Refresh Issue on Custom Domain (soloaide.in)

## Root Cause

The `_redirects` file currently in the project is a **Netlify-specific** solution. Your custom domain `soloaide.in` is hosted on **Hostinger**, which runs Apache. Apache ignores `_redirects` files entirely.

When a user visits `soloaide.in/pricing` directly (or refreshes on that page), Apache looks for a physical `/pricing` file or folder on the server. Since none exists (it's a single-page app), Hostinger's server returns its own 404 error page before your React app ever loads.

## Solution

Add an `.htaccess` file that tells Apache to route ALL requests to `index.html`, letting React Router handle the routing on the client side. Also add a `404.html` fallback page.

## Changes

### 1. Create `public/.htaccess` (Apache rewrite rules)
This file tells Apache: "For any URL that doesn't match an actual file or directory, serve `index.html` instead."

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
```

### 2. Create `public/404.html` (Fallback for hosting providers that don't support rewrites)
A simple HTML page that automatically redirects to the app's root with a script-based redirect. This serves as an extra safety net.

### 3. Keep `public/_redirects` as-is
The existing `_redirects` file remains for compatibility with Netlify-style hosting (and Lovable's built-in hosting).

## Important Note

After these changes are published, you will need to **re-upload/deploy** the files to your Hostinger hosting as well, since Hostinger is a separate server from Lovable. The `.htaccess` file needs to exist on the Hostinger server to take effect.

Alternatively, if you want a simpler setup, you could connect your `soloaide.in` domain directly through **Lovable's custom domain feature** (Project Settings > Domains). This way, your domain would point to Lovable's servers which already handle SPA routing correctly -- and you wouldn't need to manage a separate Hostinger deployment at all.

## Technical Details

| File | Purpose |
|------|---------|
| `public/.htaccess` | Apache mod_rewrite rules to redirect all routes to `index.html` |
| `public/404.html` | Fallback redirect page for hosting providers without rewrite support |
| `public/_redirects` | Existing Netlify/Lovable-compatible redirect (unchanged) |

