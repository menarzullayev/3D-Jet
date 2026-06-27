# Deployment

## Auto-deploy (GitHub → Cloudflare Pages)

Every push to `main` automatically deploys to production via Cloudflare Pages.

| URL | Purpose |
|-----|---------|
| `https://3djet.bugvector.uz` | Production (custom domain) |
| `https://3d-jet.pages.dev` | Cloudflare Pages default URL |

No manual steps required — just push to `main`.

---

## Editing styles

After editing `assets/css/style.scss`, recompile before committing:

```bash
npx sass assets/css/style.scss assets/css/style.min.css --style=compressed --source-map
```

---

## Manual deploy (optional)

If you need to deploy without pushing to GitHub:

```bash
npx wrangler pages deploy . --project-name=3d-jet --branch=main
```

Requires Wrangler authentication:

```bash
npx wrangler login
```
