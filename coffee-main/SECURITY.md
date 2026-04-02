## Production security checklist

### Environment
- Set `DJANGO_ENV=production`
- Set `DJANGO_DEBUG=false`
- Set a strong `DJANGO_SECRET_KEY` (no defaults)
- Set `DJANGO_ALLOWED_HOSTS` to your domain(s)
- Set `CORS_ALLOWED_ORIGINS` and `DJANGO_CSRF_TRUSTED_ORIGINS` to your frontend origin(s)
- If behind a proxy / load balancer: set `DJANGO_BEHIND_PROXY=true`

### HTTPS
- Terminate TLS at your reverse proxy (nginx/traefik/cloudflare)
- Keep `SECURE_SSL_REDIRECT=true` in prod
- Enable HSTS (`SECURE_HSTS_SECONDS` > 0) only after confirming HTTPS works everywhere

### Auth & API
- DRF default permissions are hardened (`IsAuthenticatedOrReadOnly`)
- Throttling enabled (tune `DRF_THROTTLE_*`)
- Keep admin (`/admin/`) behind VPN / IP allowlist if possible

### Uploads
- Upload size limited by Django settings
- Images are validated by Pillow verify (type + basic integrity)

### Logs
- Review logs for auth failures / suspicious traffic
- Consider adding centralized logging in production

### Headers
- CSP enabled in production (`django-csp`)
- Additional headers middleware enabled

