# Custom AI Instructions for GitHub Pages & Web Embedding

## GitHub Pages & Web Embedding Rules
1. **Relative Asset Paths**: Always configure Vite with relative paths by setting `base: './'` in `vite.config.ts`.
2. **GitHub Actions Workflow**: Always create `.github/workflows/deploy.yml` so the project deploys automatically to GitHub Pages when pushed to GitHub.
3. **Pure Client-Side Architecture**: Ensure the application is built as a client-side SPA (React + Vite) that can run directly in any web browser or embedded `<iframe>` without requiring a Node.js backend server.
4. **Embed Compatibility**: Ensure all asset references, router setups, and links use relative paths to work seamlessly inside embedded website `<iframe>` elements.
