# 📜 ZipUrl — Deployment & Troubleshooting Execution Log

## 🎯 Architecture Summary
- **Frontend**: React 19 + Vite deployed on **Cloudflare Pages CDN** (Privacy-first `localStorage` link history).
- **Edge Security Shield**: **Cloudflare Edge Proxy** (Full Strict SSL Mode, TLS 1.3, origin IP CIDR lockdown).
- **API Gateway & Microservice Proxy**: **Host-Native Nginx** on AWS EC2:
  - `api.zipurl.dpdns.org` ➔ proxies to `url-service:5002` (Shortening Engine)
  - `s.zipurl.dpdns.org` ➔ proxies to `redirect-service:5003` (Sub-15ms Redirection Engine)
- **Data & In-Memory Layer**: Host-Native **PostgreSQL 16** (`BIGSERIAL` + partial unique indexes) & **Redis 7** (Cache-Aside + 5-min Sentinel Negative Caching).

---

## 🛠️ Resolved Issue Log

### Issue 1: PostgreSQL & Redis Network Refusal for Docker Containers
- **Symptom**: `connect ECONNREFUSED 172.17.0.1:6379` & `no pg_hba.conf entry for host "172.18.0.3"`.
- **Root Cause**: Host PostgreSQL and Redis were listening only on `127.0.0.1` and `protected-mode yes` was enabled in Redis.
- **Resolution**: Updated `pg_hba.conf` to allow `0.0.0.0/0`, updated `postgresql.conf` (`listen_addresses = '*'`), and updated `redis.conf` (`bind 0.0.0.0`, `protected-mode no`).

### Issue 2: Cloudflare SSL Error 526
- **Symptom**: `GET https://api.zipurl.dpdns.org/all net::ERR_FAILED 526`.
- **Root Cause**: Cloudflare Full (Strict) SSL mode requires a valid certificate chain on the EC2 origin server.
- **Resolution**: Installed a 15-Year **Cloudflare Origin CA Certificate** in `/etc/ssl/certs/origin-cert.pem` and `/etc/ssl/private/origin-key.pem` on host Nginx.

### Issue 3: Microservice Subdomain Decoupling (`s.zipurl.dpdns.org`)
- **Symptom**: `https://zipurl.dpdns.org/code` returned Cloudflare Pages 404 because `zipurl.dpdns.org` is assigned to static SPA hosting.
- **Root Cause**: Static SPA hosting on Cloudflare Pages intercepts root paths.
- **Resolution**: Configured short URLs to generate under `https://s.zipurl.dpdns.org/code`. Cloudflare DNS routes `s.zipurl.dpdns.org` directly to EC2 Nginx, which proxies to `redirect-service:5003` for sub-15ms redirection!

---
*Created for Revanth • ZipUrl Deployment & Troubleshooting Log*
