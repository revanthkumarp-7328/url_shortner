# 📄 ZipUrl — Ultimate Resume Descriptions (Nginx, TTL, SSL & Infrastructure Focus)

Below are recruiter-optimized resume entries for **ZipUrl** featuring explicit technical callouts for **Nginx DNS TTL**, **Redis Cache TTL**, **Cloudflare SSL/TLS Encryption**, **Base62 Bijective Encoding**, and **Redis Streams**.

---

## 🔥 Style A: Deep Infrastructure & Systems Focus (Recommended for SDE / Backend Roles)

### **URL Shortener — zipurl.dpdns.org** | *Node.js, Express, PostgreSQL 16, Redis Streams, Docker, Nginx, AWS EC2, Cloudflare, React 19*
- **Microservices Architecture**: Engineered **ZipUrl**, a production-grade, low-latency URL shortener composed of **5 decoupled microservices** (`Gateway`, `Auth`, `URL`, `Redirect`, `Analytics`) containerized via Docker Compose on AWS EC2 behind an Nginx reverse proxy.
- **Bijective Encoding & Zero-Collision Keys**: Mapped PostgreSQL `BIGSERIAL` auto-incrementing primary keys to 6-character **Base62 strings**, guaranteeing **100% mathematically unique short links** without requiring distributed locks or database collision checks (`SELECT EXISTS`).
- **Multi-Layer TTL & Redis Caching**: Implemented a Redis cache-aside strategy on the high-throughput redirection path with a **24-hour TTL (`EX 86400`)**, serving cached lookups in **<2ms** and achieving **sub-15ms HTTP 302 redirection latency**.
- **Asynchronous Click Telemetry Stream**: Built a non-blocking analytics engine using **Redis Streams (`XADD` / `XREADGROUP`)** and a background consumer group worker, parsing **MaxMind GeoIP** locations and **User-Agent headers** into PostgreSQL without affecting HTTP redirection speed.
- **Nginx DNS TTL & Cloudflare SSL Security**: Configured Nginx with an embedded Docker DNS resolver (**`resolver 127.0.0.11 valid=10s`**) to eliminate 502 Bad Gateway errors on container restarts, secured with **Cloudflare Flexible SSL/TLS encryption** and `CF-Connecting-IP` header forwarding.
- **Single-Domain Edge Deployment**: Routed static SPA traffic to **Cloudflare Pages CDN** and API traffic to the EC2 origin server, exposing the entire platform under a unified domain.
- **Live Project**: [zipurl.dpdns.org](https://zipurl.dpdns.org)

---

## 🎨 Style B: Full-Stack Enterprise Product Focus (Recommended for Full-Stack Roles)

### **ZipUrl — Distributed URL Shortener & Analytics Platform** | *Node.js, PostgreSQL, Redis, Docker, Nginx, AWS EC2, Cloudflare Pages*
- **Event-Driven Microservices Engine**: Built a distributed URL shortening platform orchestrating 5 containerized Node.js services (`Auth`, `URL`, `Redirect`, `Analytics`, `Gateway`) behind Nginx on AWS EC2 with **Cloudflare Flexible SSL** termination.
- **Sub-15ms Redirection & Cache TTL**: Serves short code lookups in **<15ms** via Redis cache-aside with a **24-hour cache TTL**, decoupling click data ingestion into a **Redis Stream (`XREADGROUP`)** consumer worker that resolves MaxMind GeoIP telemetry asynchronously.
- **Collision-Free Base62 Mapping**: Mapped `BIGSERIAL` PostgreSQL sequence IDs to 6-character Base62 codes, ensuring 100% collision-free short URLs with zero locking overhead.
- **Zero-Downtime Reverse Proxying**: Implemented **Nginx dynamic DNS resolution (`resolver 127.0.0.11 valid=10s`)** to handle dynamic container IP changes, forwarding client IP headers across Cloudflare Edge and AWS EC2.
- **Real-Time Glassmorphic UI**: Developed a React 19 single-page application with 3-second live auto-sync polling, Recharts visual analytics, and custom glassmorphism design.
- **Live Link**: [zipurl.dpdns.org](https://zipurl.dpdns.org)

---

## 💡 Quick Copy Section (Single Text Block for One-Click Resume Uploads)

```text
URL Shortener — zipurl.dpdns.org | Node.js, Express, PostgreSQL 16, Redis Streams, Docker, Nginx, AWS EC2, Cloudflare, React 19
• Engineered ZipUrl, a low-latency URL shortener composed of 5 decoupled microservices (Gateway, Auth, URL, Redirect, Analytics) containerized via Docker Compose on AWS EC2 behind Nginx.
• Mapped PostgreSQL BIGSERIAL primary keys to 6-character Base62 strings, guaranteeing 100% collision-free short links without requiring distributed locks or database collision pre-checks.
• Implemented a Redis cache-aside strategy on the redirection path with a 24-hour TTL (EX 86400), serving lookups in <2ms and achieving sub-15ms HTTP 302 redirection latency.
• Built a non-blocking analytics engine using Redis Streams (XADD / XREADGROUP) and a consumer worker, parsing MaxMind GeoIP and User-Agent headers into PostgreSQL asynchronously.
• Configured Nginx with embedded Docker DNS resolution (resolver 127.0.0.11 valid=10s) to eliminate 502 Bad Gateway errors on container restarts, secured via Cloudflare Flexible SSL/TLS and CF-Connecting-IP header forwarding.
• Project Link: https://zipurl.dpdns.org
```

---
*Created for Revanth • Ultimate Product Resume Description featuring Nginx, TTL, & SSL*
