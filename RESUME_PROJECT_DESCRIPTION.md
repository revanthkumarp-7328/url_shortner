# 📄 ZipUrl — Ultimate Resume Descriptions (Native Nginx & Host DB Focus)

Below are recruiter-optimized resume entries for **ZipUrl** featuring explicit technical callouts for **Independent Microservices**, **Host-Native Nginx**, **Host-Native Postgres & Redis**, **Sentinel Negative Caching (5-min TTL)**, **Partial Indexes**, **Cloudflare Origin CA Certificates**, and **Origin IP CIDR Lockdown**.

---

## 🔥 Style A: Deep Systems & Infrastructure Focus (Recommended for SDE / Backend Roles)

### **URL Shortener — zipurl.dpdns.org** | *Node.js, Express, PostgreSQL 16, Redis, Docker, Nginx, AWS EC2, Cloudflare*
- **Microservices & Native Nginx Architecture**: Engineered **ZipUrl**, a production-grade, low-latency URL shortener composed of **two independent microservices** (`shortening` and `redirection`) containerized via Docker on a Linux AWS EC2 host behind a native Nginx reverse proxy.
- **Collision-Free Storage & Partial Indexes**: Backed shortening path by PostgreSQL utilizing `BIGSERIAL` primary keys, custom alias partial indexes (`CREATE UNIQUE INDEX ... WHERE custom_alias IS NOT NULL`), and unique constraints as the sole collision arbiter—requiring no distributed locks.
- **Redis Cache-Aside & Sentinel Negative Caching**: Implemented Redis cache-aside on the high-throughput redirection path with **sentinel-value negative caching (5-minute TTL)** to absorb bot probing and invalid code lookups without hitting PostgreSQL on repeated attempts.
- **Host-Native Systems & Low Latency**: Configured containers to interact directly with host-native PostgreSQL 16, Redis 7, and Nginx on EC2 (`127.0.0.1`), achieving **sub-15ms HTTP 302 redirection latency**.
- **Enterprise SSL & Origin Lockdown**: Secured Nginx with **15-year Cloudflare Origin CA certificates** in **Full (Strict) SSL mode over HTTPS Port 443** (with forced Port 80 HTTP 301 redirects), locking down AWS EC2 Security Group inbound rules strictly to Cloudflare IPv4 CIDR ranges.
- **Single-Domain Edge Deployment**: Configured Cloudflare Pages for global frontend distribution and proxied API traffic to the EC2 origin server under a single unified domain.
- **Live Project**: [zipurl.dpdns.org](https://zipurl.dpdns.org)

---

## 💡 Quick Copy Section (Single Text Block for One-Click Resume Uploads)

```text
URL Shortener — zipurl.dpdns.org | Node.js, Express, PostgreSQL 16, Redis, Docker, Nginx, AWS EC2, Cloudflare, React 19
• Built ZipUrl, a production-grade, low-latency URL shortener with two independent microservices (shortening and redirection) backed by PostgreSQL with partial indexes, BIGSERIAL primary keys, and a unique constraint as the sole collision arbiter—requiring no distributed locks.
• Implemented Redis cache-aside on the high-throughput redirection path with sentinel-value negative caching (5-min TTL) to absorb bot probing without hitting the database on repeated invalid lookups.
• Deployed microservice containers on a Linux (AWS EC2) host interacting with host-native Nginx, PostgreSQL, and Redis behind Cloudflare Origin Certificates in Full (Strict) SSL mode over HTTPS Port 443.
• Locked origin EC2 Security Group inbound access strictly to Cloudflare IPv4 CIDR ranges, enforcing end-to-end encrypted and verified origin proxying.
• Project Link: https://zipurl.dpdns.org
```

---

*Updated for Revanth • Ultimate Resume Description featuring Native Nginx, Host DB, & Negative Caching*
