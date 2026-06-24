# Deployment Guide

## Live URLs

| URL | Maqsad |
|-----|--------|
| `https://3djet.bugvector.uz` | Asosiy custom domen |
| `https://3d-jet.pages.dev` | Cloudflare Pages default URL |

---

## Infrastructure

| Komponent | Qiymat |
|-----------|--------|
| Hosting | Cloudflare Pages |
| Project name | `3d-jet` |
| Account | `saidakbarnarzullayev@mail.ru` |
| Account ID | `46603bc6a71d8639b6ee885a4003847c` |
| Domain registrar | Eskiz IT Company |
| DNS provider | Cloudflare (nameservers: `beau.ns.cloudflare.com`, `christina.ns.cloudflare.com`) |
| Zone ID | `fd25ca0ef2e57b76de763dbcebb19807` |
| GitHub repo | `https://github.com/menarzullayev/3D-Jet` |

---

## DNS record

`bugvector.uz` zonasida quyidagi CNAME yozuv mavjud:

```
Type:    CNAME
Name:    3djet
Content: 3d-jet.pages.dev
Proxied: true (Cloudflare CDN orqali)
```

---

## Qayta deploy qilish (wrangler)

```bash
# 1. Wrangler autentifikatsiya (bir marta, token ~24 soat)
npx wrangler login

# 2. Deploy
npx wrangler pages deploy . --project-name=3d-jet --branch=main
```

> Deploy qilinuvchi papka: loyiha root (`index.html` joylashgan joy).

---

## Yangi custom domen qo'shish

```bash
# 1. Cloudflare Pages ga domen bog'lash (API)
CF_TOKEN="<wrangler oauth token>"
curl -X POST \
  "https://api.cloudflare.com/client/v4/accounts/46603bc6a71d8639b6ee885a4003847c/pages/projects/3d-jet/domains" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "yangi.bugvector.uz"}'

# 2. DNS CNAME yozuvi (tunnel tokeni yoki Cloudflare dashboard)
# Zone ID: fd25ca0ef2e57b76de763dbcebb19807
curl -X POST \
  "https://api.cloudflare.com/client/v4/zones/fd25ca0ef2e57b76de763dbcebb19807/dns_records" \
  -H "Authorization: Bearer <tunnel-token>" \
  -H "Content-Type: application/json" \
  -d '{"type":"CNAME","name":"yangi","content":"3d-jet.pages.dev","proxied":true,"ttl":1}'
```

> **Muhim:** Wrangler OAuth tokeni `zone:read` huquqiga ega (DNS o'zgartira olmaydi).  
> DNS record uchun `~/.cloudflared/cert.pem` dagi tunnel API tokenidan foydalaniladi.

---

## Token manbalari

| Token | Joylashuv | Ruxsatlar |
|-------|-----------|-----------|
| Wrangler OAuth | `~/.config/.wrangler/config/default.toml` | `pages:write`, `zone:read`, va boshqalar |
| Cloudflare Tunnel | `~/.cloudflared/cert.pem` (base64 JSON) | DNS write, tunnel boshqaruvi |

---

## Mavjud Cloudflare tunnels

```
tunnel: baed7e7f-749c-438b-abf2-1f2e3a60df3b
app.bugvector.uz → localhost:8001 (tgplatform API)
```

---

## SCSS qayta kompilyatsiya

Stillarni o'zgartirgandan keyin:

```bash
npx sass assets/css/style.scss assets/css/style.min.css --style=compressed --source-map
```

Keyin deploy qilish:

```bash
npx wrangler pages deploy . --project-name=3d-jet --branch=main
```
