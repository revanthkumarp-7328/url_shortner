# 📄 ZipUrl — Ultimate Resume Descriptions (2-Microservice Architecture Focus)

Below are recruiter-optimized resume entries for **ZipUrl** featuring explicit technical callouts for **Independent Microservices**, **Host-Native Postgres & Redis**, **Sentinel Negative Caching (5-min TTL)**, **Partial Indexes**, **Cloudflare Origin CA Certificates**, and **Origin IP CIDR Lockdown**.

---

## 🔥 Style A: Deep Systems & Microservices Focus (Recommended for SDE / Backend Roles)

### **URL Shortener — dwaar.in / zipurl.dpdns.org** | *Node.js, Express, PostgreSQL 16, Redis, Docker, Nginx, AWS EC2, Cloudflare*
- **Independent Microservices Architecture**: Engineered **ZipUrl**, a production-grade, low-latency URL shortener composed of **two independent microservices** (`shortening` and `redirection`) containerized via Docker Compose on a Linux AWS EC2 host behind an Nginx reverse proxy.
- **Collision-Free Storage & Partial Indexes**: Backed shortening path by PostgreSQL utilizing `BIGSERIAL` primary keys, custom alias partial indexes (`CREATE UNIQUE INDEX ... WHERE custom_alias IS NOT NULL`), and unique constraints as the sole collision arbiter—requiring no distributed locks.
- **Redis Cache-Aside & Sentinel Negative Caching**: Implemented Redis cache-aside on the high-throughput redirection path with **sentinel-value negative caching (5-minute TTL)** to absorb bot probing and invalid code lookups without hitting PostgreSQL on repeated attempts.
- **Host-Native Database & Low Latency**: Configured containers to interact directly with host-native PostgreSQL 16 and Redis 7 on EC2 (`host.docker.internal`), achieving **sub-15ms HTTP 302 redirection latency**.
- **Enterprise SSL & Origin Lockdown**: Secured Nginx with **15-year Cloudflare Origin CA certificates** in **Full (Strict) SSL mode over HTTPS Port 443** (with forced Port 80 HTTP 301 redirects), and locked down AWS EC2 Security Group inbound rules strictly to Cloudflare IPv4 CIDR ranges.
- **Single-Domain Edge Deployment**: Configured Cloudflare Pages for global frontend distribution and proxied API traffic to the EC2 origin server under a single unified domain.
- **Live Project**: [zipurl.dpdns.org](https://zipurl.dpdns.org)

---

## 🎨 Style B: High-Throughput Product Engineering Focus (Recommended for SDE / Product Roles)

### **ZipUrl — High-Performance Microservices Shortener** | *Node.js, PostgreSQL 16, Redis 7, Docker, Nginx, AWS EC2, Cloudflare*
- **Two Decoupled Microservices**: Built a high-throughput URL shortener decoupling link generation (`url-service:5002`) from instant redirection (`redirect-service:5003`) on AWS EC2 behind Nginx.
- **Sentinel Negative Cache (5-min TTL)**: Shielded the database from malicious bot probing by caching invalid lookups in host Redis for 5 minutes, serving valid 302 redirects in **<2ms** from in-memory cache.
- **PostgreSQL Collision Arbiter**: Utilized `BIGSERIAL` auto-incrementing IDs and PostgreSQL partial unique indexes to guarantee 100% collision-free custom aliases with zero distributed locking overhead.
- **Enterprise Security & mTLS Lockdown**: Deployed Nginx on Port 443 HTTPS backed by Cloudflare Origin CA certificates in Full (Strict) mode, restricting origin inbound access to whitelisted Cloudflare edge IP ranges.
- **Live Project**: [zipurl.dpdns.org](https://zipurl.dpdns.org)

---

## 💡 Quick Copy Section (Single Text Block for One-Click Resume Uploads)

```text
URL Shortener — zipurl.dpdns.org | Node.js, Express, PostgreSQL 16, Redis, Docker, Nginx, AWS EC2, Cloudflare, React 19
• Built ZipUrl, a production-grade, low-latency URL shortener with two independent microservices (shortening and redirection) backed by PostgreSQL with partial indexes, BIGSERIAL primary keys, and a unique constraint as the sole collision arbiter—requiring no distributed locks.
• Implemented Redis cache-aside on the high-throughput redirection path with sentinel-value negative caching (5-min TTL) to absorb bot probing without hitting the database on repeated invalid lookups.
• Deployed microservice containers on a Linux (AWS EC2) host interacting with host-native PostgreSQL and Redis behind Nginx with Cloudflare Origin Certificates in Full (Strict) SSL mode over HTTPS Port 443.
• Locked origin EC2 Security Group inbound access strictly to Cloudflare IPv4 CIDR ranges, enforcing end-to-end encrypted and verified origin proxying.
• Project Link: https://zipurl.dpdns.org
```

---

*Updated for Revanth • Ultimate 2-Microservice Resume Description featuring Host DB, Negative Caching, & Origin Lockdown*
