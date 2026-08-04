# 🎙️ Master Interview Preparation & System Architecture Guide

## 📌 Project Name: ZipUrl — Distributed Microservices URL Shortener

---

## 🎯 1. The 30-Second Elevator Pitch

> *"I designed and deployed **ZipUrl**—a production-grade, low-latency URL shortener composed of **two independent microservices** (`url-service` for link generation and `redirect-service` for fast redirection) containerized on AWS EC2 behind an Nginx reverse proxy.
> 
> The system achieves **sub-15ms redirection latency** by serving short code lookups directly from an in-memory Redis cache-aside layer. To absorb malicious bot probing without hitting PostgreSQL on repeated invalid lookups, I implemented **sentinel-value negative caching (5-minute TTL)** on the redirection path. Storage is backed by **host-native PostgreSQL** with `BIGSERIAL` primary keys, partial indexes, and unique constraints serving as the sole collision arbiter—requiring no distributed locks. The origin EC2 server is secured with **15-year Cloudflare Origin CA certificates** in **Full (Strict)** mode over HTTPS Port 443, locked strictly to Cloudflare IPv4 CIDR ranges."*

---

## 🏗️ 2. System Architecture Diagram

```
                               ┌────────────────────────┐
                               │  Client / Browser      │
                               └───────────┬────────────┘
                                           │ (HTTPS TLS 1.3)
                                           ▼
                               ┌────────────────────────┐
                               │    Cloudflare Edge     │
                               │ (Full Strict SSL Mode) │
                               └───────────┬────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    │ (Port 443 HTTPS Proxy)                      │ (Static Hosting)
                    │ [Cloudflare CIDR Inbound Rule Whitelisted]  │
                    ▼                                             ▼
      ┌────────────────────────┐                    ┌────────────────────────┐
      │ AWS EC2 (Elastic IP)   │                    │   Cloudflare Pages     │
      │ Nginx Reverse Proxy    │                    │   React 19 + Vite UI   │
      │ • Port 443 (HTTPS TLS) │                    └────────────────────────┘
      │ • Port 80 (HTTP 301)   │
      │ • Docker DNS 10s TTL   │
      └─────────────┬──────────┘
                    │
     ┌──────────────┴───────────────────────────┐
     │                                          │
     ▼ (api.zipurl.dpdns.org)                   ▼ (s.zipurl.dpdns.org)
 ┌───────────────────────┐                  ┌────────────────────────┐
 │  url-service (5002)   │                  │ redirect-service (5003)│
 │  (Shortening Engine)  │                  │  (Redirection Engine)  │
 └───────────┬───────────┘                  └───────────┬────────────┘
             │                                          │
             └───────────────────┬──────────────────────┘
                                 │ (host.docker.internal)
                                 ▼
                     ┌───────────────────────┐
                     │ AWS EC2 Host System   │
                     │ • PostgreSQL 16 DB    │
                     │ • Redis 7 Cache       │
                     └───────────────────────┘
```

---

## ⚡ 3. Detailed Microservices Breakdown

| Microservice | Port | Primary Responsibility | Key Technologies |
| :--- | :--- | :--- | :--- |
| **URL Service** | `5002` | Short URL creation, Base62 code generation, custom alias partial index validation, password protection, and Redis cache pre-warming. | Express, Base62, Redis, PostgreSQL |
| **Redirect Engine** | `5003` | Sub-15ms HTTP 302 redirections, Redis cache-aside lookups, sentinel negative caching (5-min TTL), password verification, and expiration checks. | Express, Redis, PostgreSQL |

---

## 🔬 4. Core System Design Principles & Engineering Decisions

### 1. Collision-Free Generation & Partial Indexes
- **Mechanism**: PostgreSQL `BIGSERIAL` primary keys produce 64-bit sequence IDs mapped into Base62 strings.
- **Partial Index Arbiter**: For custom aliases, PostgreSQL enforces uniqueness via a partial index (`CREATE UNIQUE INDEX idx_urls_custom_alias ON urls(custom_alias) WHERE custom_alias IS NOT NULL;`).
- **No Distributed Locks**: Relies on PostgreSQL unique constraints as the ultimate arbiter, avoiding expensive distributed lock mechanisms (e.g. Redlock or ZooKeeper).

### 2. High-Throughput Redirection & Sentinel Negative Caching
- **Fast Path Cache-Aside**: Redirection lookups check Redis (`short:<code>`) first, completing in **< 2ms**.
- **Sentinel Negative Cache (5-min TTL)**: When a non-existent short code is requested, Redis sets a sentinel key (`short:invalid:<code>` with a 300-second TTL). Subsequent bot probing or invalid requests hit Redis instantly and return HTTP 404 without querying PostgreSQL.

### 3. Origin Shielding & Cloudflare mTLS Security
- **Cloudflare Origin CA**: Nginx uses a 15-year Origin CA certificate (`origin-cert.pem`) in Cloudflare **Full (Strict)** SSL mode over HTTPS Port 443.
- **AWS Security Group Inbound CIDR Whitelisting**: Port 443 and Port 80 access on EC2 is locked down strictly to Cloudflare's published IPv4 CIDR ranges, preventing direct IP bypass attacks.

---

## 💬 5. Technical Questions & Answers for Interviews

### Q1: Why did you separate URL Shortening and Redirection into two microservices?
> **Answer**: *"Shortening and Redirection have vastly different throughput requirements. Redirection accounts for **95%+ of incoming traffic** and demands sub-15ms latency. By isolating `redirect-service` from `url-service`, redirection can scale independently without being impacted by CPU-heavy password hashing or database write queries."*

### Q2: How do you handle collision arbitration without distributed locks?
> **Answer**: *"We rely on PostgreSQL unique constraints and partial indexes (`CREATE UNIQUE INDEX ... WHERE custom_alias IS NOT NULL`) as the sole collision arbiter. If a collision occurs during creation, PostgreSQL raises a unique constraint violation (HTTP 409), eliminating the need for distributed locks."*

### Q3: How do you prevent bot scanners from exhausting database connection pools?
> **Answer**: *"I implemented **sentinel negative caching** in Redis. When an invalid or non-existent short code is requested, `redirect-service` writes a 5-minute TTL key (`short:invalid:<code> = 1`). Repeated bot requests hit Redis instantly and exit with HTTP 404, completely shielding PostgreSQL."*

### Q4: How is security handled between Cloudflare and your EC2 origin?
> **Answer**: *"I configured **Cloudflare Full (Strict) SSL Mode** using a 15-year Cloudflare Origin CA certificate installed on Nginx on HTTPS Port 443. Additionally, I locked down AWS EC2 Security Group inbound rules strictly to Cloudflare's IPv4 CIDR ranges, creating an **Origin Shield** that blocks any direct IP bypass attempts."*

---

*Prepared for Revanth • Master 2-Microservice System Architecture & Interview Pitch Guide*
