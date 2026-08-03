# 📘 Production Deployment & Troubleshooting Log

## 🚀 ZipUrl Enterprise Microservices Architecture

This log documents all technical challenges, root causes, and engineering resolutions encountered during the production deployment of **ZipUrl** across **AWS EC2**, **Docker Compose**, **Cloudflare Pages**, **Nginx**, **PostgreSQL**, and **Redis Streams**.

---

### 📋 System Summary
- **Frontend App**: Deployed on Cloudflare Pages (`https://zipurl.dpdns.org`)
- **Backend API Gateway**: Deployed on AWS EC2 (`https://api.zipurl.dpdns.org`)
- **Short Link Engine**: Deployed on AWS EC2 (`https://s.zipurl.dpdns.org`)
- **Database & Cache**: PostgreSQL 16 + Redis 7

---

## 🛠️ Deployment Issues & Engineering Resolutions

### 1. Cloudflare SSL/TLS Encryption & Origin Certificate Setup
- **Symptom**: Accessing `https://api.zipurl.dpdns.org` or `https://s.zipurl.dpdns.org` returned Cloudflare Error 521 (Origin Server Down).
- **Root Cause**: Cloudflare SSL mode was set to "Full (Strict)", requiring a valid SSL certificate installed on origin EC2 Nginx server. However, origin Nginx was initially listening on Port 80 (HTTP).
- **Resolution**:
  - **Phase 1 (Initial Setup)**: Temporarily switched Cloudflare to Flexible SSL to establish initial HTTP connectivity.
  - **Phase 2 (Enterprise Security Production Upgrade)**:
    1. Generated a 15-year **Cloudflare Origin CA Certificate** (`*.zipurl.dpdns.org`).
    2. Saved `origin-cert.pem` and `origin-key.pem` in EC2 directory `/infrastructure/nginx/certs/` and mounted into Nginx container.
    3. Reconfigured Nginx to listen on **Port 443 HTTPS** with TLS 1.2/1.3 and redirect all Port 80 HTTP traffic (`return 301 https://$host$request_uri;`).
    4. Switched Cloudflare SSL/TLS mode to **Full (Strict)**, enabling end-to-end encrypted and verified origin traffic.

---

### 2. `express-rate-limit` IP Verification Crash (`ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`)
- **Symptom**: API Gateway crashed immediately on startup with `express-rate-limit` proxy verification error.
- **Root Cause**: Behind reverse proxies (Cloudflare + Nginx), Express requires explicit proxy trust settings to safely parse `X-Forwarded-For` headers.
- **Resolution**:
  - Added `app.set('trust proxy', 1);` across all microservice entrypoints:
    - `backend/api-gateway/index.js`
    - `backend/services/auth-service/index.js`
    - `backend/services/url-service/index.js`
    - `backend/services/redirect-service/index.js`
    - `backend/services/analytics-service/index.js`

---

### 3. Nginx 502 Bad Gateway on Container Restarts
- **Symptom**: Short link redirections (`https://s.zipurl.dpdns.org/<code >`) returned Nginx 502 Bad Gateway after Docker containers restarted.
- **Root Cause**: Nginx cached internal Docker container IP addresses at startup. When Docker recreated microservice containers, IP addresses changed, causing Nginx to proxy traffic to stale IP addresses.
- **Resolution**:
  - Updated `infrastructure/nginx/nginx.conf` to include Docker's embedded DNS resolver (`resolver 127.0.0.11 valid=10s;`).
  - Converted upstream targets to dynamic variables (`set $redirect_upstream http://redirect-service:5003; proxy_pass $redirect_upstream;`), forcing Nginx to re-resolve container IPs every 10 seconds.

---

### 4. Frontend API Request Routing Mismatch (`localhost` fallback)
- **Symptom**: Clicking "Sign In" or "Register" on Cloudflare Pages threw `Authentication failed. Please check your credentials`.
- **Root Cause**: Vite evaluated `import.meta.env.VITE_API_BASE_URL` as `undefined` at build time in Cloudflare Pages, causing compiled browser assets to route requests to `http://localhost:5000/api/v1` instead of `https://api.zipurl.dpdns.org/api/v1`.
- **Resolution**:
  - Updated `frontend/src/services/api.js` with dynamic hostname checking:
    ```js
    const isLocal = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const API_BASE_URL = isLocal 
      ? 'http://localhost:5000/api/v1' 
      : 'https://api.zipurl.dpdns.org/api/v1';
    ```

---

### 5. CORS Preflight Block on Cross-Origin Requests
- **Symptom**: Browser preflight `OPTIONS` requests from Cloudflare Pages to EC2 API Gateway were blocked by CORS rules.
- **Root Cause**: Express `cors()` default settings did not explicitly reflect requesting origins or handle credentials headers for preflight requests.
- **Resolution**:
  - Updated CORS configuration across microservices:
    ```js
    app.use(cors({ origin: true, credentials: true }));
    ```

---

### 6. Analytics Worker Crash (`value too long for type character varying(45)`)
- **Symptom**: Background Analytics Redis Stream worker logged continuous errors: `[Analytics Worker Loop Error] value too long for type character varying(45)`.
- **Root Cause**: Proxy `X-Forwarded-For` headers contained comma-separated IP chains (e.g. `"172.71.152.86, 65.0.41.154"`) exceeding 45 characters, causing PostgreSQL `INSERT INTO clicks` to fail.
- **Resolution**:
  - Created migration `002_expand_click_columns.sql` to expand `clicks` table columns (`ip_address`, `country`, `city`, `browser`, `os`, `device`) to `TEXT` type.
  - Updated `redirect-service` and `analytics-service` to extract the primary client IP from comma-separated proxy chains.

---

### 7. GeoIP VPN & Real-Time IP Detection
- **Symptom**: Clicks through a VPN did not update the country/location in real-time analytics.
- **Root Cause**: Nginx was not forwarding Cloudflare's `CF-Connecting-IP` header to backend microservices.
- **Resolution**:
  - Added `proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;` to `infrastructure/nginx/nginx.conf`.
  - Updated microservices to prioritize `req.headers['cf-connecting-ip']` when resolving IP addresses for MaxMind GeoIP lookups.

---

### 8. JWT Secret Key Synchronization Across Microservices
- **Symptom**: Analytics summary endpoint returned `{ error: 'Invalid or expired token' }` despite valid user login.
- **Root Cause**: `auth-service` signed tokens using `.env` `JWT_SECRET`, while `analytics-service` fell back to a default secret key.
- **Resolution**:
  - Synchronized default `JWT_SECRET` in `backend/shared/config/index.js` to `ProductionJwtSecretKeyZipUrl2026!`.

---

## 🏆 Key Takeaways & Best Practices

1. **Always Use Embedded DNS Resolvers in Nginx + Docker**: Using `resolver 127.0.0.11 valid=10s;` prevents 502 Bad Gateway errors when containers restart.
2. **Handle Multi-Layer Proxy Headers**: Always parse `CF-Connecting-IP` and split `X-Forwarded-For` comma chains when running behind Cloudflare & Nginx.
3. **Hardcode Fallbacks for Vite Build Vars**: For single-page apps deployed on static hosts (Cloudflare Pages), provide runtime fallback logic for API base URLs.
4. **Synchronize Shared Configs**: Centralize JWT secrets, Redis stream keys, and DB credentials in shared config modules to avoid inter-service authentication failures.

---
*Created with ❤️ by Revanth • ZipUrl Deployment Log*
