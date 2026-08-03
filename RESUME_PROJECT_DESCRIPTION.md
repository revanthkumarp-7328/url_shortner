# 📄 ZipUrl — Tier-1 Product Company Resume Description

This document provides elite, recruiter-grade resume descriptions for **ZipUrl** modeled after top-tier software engineering resumes at **FAANG / Tier-1 Product Companies** (Google, Amazon, Meta, Uber, Microsoft, Stripe, Razorpay).

---

## 🚀 Recommended Resume Entry (Copy & Paste Ready)

### **URL Shortener — zipurl.dpdns.org** | *Node.js, Express, PostgreSQL 16, Redis Streams, Docker, Nginx, AWS EC2, Cloudflare Pages, React 19*
- **Distributed Microservices Architecture**: Built **ZipUrl**, a production-grade, event-driven URL shortener composed of **5 decoupled microservices** (`Auth`, `URL`, `Redirect`, `Analytics`, `Gateway`) orchestrated via Docker Compose on an AWS EC2 host behind an Nginx reverse proxy.
- **Collision-Free Encoding Engine**: Designed a **Base62 bijective encoding scheme** mapped to PostgreSQL `BIGSERIAL` primary keys, guaranteeing **100% collision-free short-code generation** without requiring distributed locks or database `SELECT EXISTS` pre-checks.
- **Sub-15ms Redirection & Redis Caching**: Implemented a Redis cache-aside strategy with **24-hour TTL (`EX 86400`)** on the high-throughput redirection path, serving cached short-code lookups in **<2ms** and achieving sub-15ms total HTTP 302 redirection latency.
- **Asynchronous Click Telemetry Pipeline**: Built a decoupled analytics stream using **Redis Streams (`XADD` / `XREADGROUP`)** and a background consumer group worker, parsing **MaxMind GeoIP** and **User-Agent header telemetry** into PostgreSQL without blocking the HTTP redirection response loop.
- **Zero-Downtime Networking & Cloudflare Integration**: Configured Nginx with **Docker embedded DNS resolution (`resolver 127.0.0.11 valid=10s`)** to eliminate 502 Bad Gateway errors on container restarts, forwarding `CF-Connecting-IP` headers for true client IP resolution across Cloudflare Pages and EC2.
- **Live Project**: [zipurl.dpdns.org](https://zipurl.dpdns.org)

---

## ⚡ Concise Version (4-Bullet Format)

### **ZipUrl — Microservices Shortener & Analytics** | *Node.js, Express, PostgreSQL, Redis Streams, Docker, AWS EC2, Cloudflare*
- **Microservice System Design**: Built an event-driven system with 5 independent Node.js microservices (`Gateway`, `Auth`, `URL`, `Redirect`, `Analytics`), containerized with Docker Compose and reverse-proxied via Nginx on AWS EC2.
- **Zero-Collision Base62 Engine**: Mapped PostgreSQL `BIGSERIAL` auto-incrementing keys to 6-character Base62 strings, achieving mathematically unique short links without distributed locking or database query overhead.
- **High-Throughput Async Analytics**: Streamed click telemetry asynchronously using **Redis Streams (`XREADGROUP`)**, resolving GeoIP locations and device signatures into PostgreSQL while keeping redirection latency **<15ms**.
- **Edge Deployment & High Availability**: Deployed React 19 SPA on Cloudflare Pages CDN and configured Nginx with dynamic Docker DNS resolution (`resolver 127.0.0.11`) and Cloudflare Flexible SSL.
- **Live Link**: [zipurl.dpdns.org](https://zipurl.dpdns.org)

---

## 💡 Bullet-by-Bullet Technical Breakdown (Why This Impresses Product Companies)

1. **"Base62 bijective encoding scheme mapped to PostgreSQL BIGSERIAL primary keys..."**
   - *Why recruiters love it*: Proves deep knowledge of data structures, algorithm efficiency ($O(1)$ short code generation), and database primary key mechanics.

2. **"Redis Streams (`XADD` / `XREADGROUP`) background consumer group worker..."**
   - *Why recruiters love it*: Demonstrates real-world understanding of event-driven architectures, queueing theory, non-blocking I/O, and asynchronous stream processing.

3. **"Redis cache-aside strategy with 24-hour TTL (`EX 86400`)..."**
   - *Why recruiters love it*: Shows mastery of caching patterns, TTL eviction strategies, and sub-15ms performance optimization.

4. **"Docker embedded DNS resolution (`resolver 127.0.0.11 valid=10s`)...."**
   - *Why recruiters love it*: Highlights production DevOps troubleshooting, reverse proxy networking, and zero-downtime microservices orchestration.

---
*Prepared for Revanth • Elite Product Company Resume Description*
