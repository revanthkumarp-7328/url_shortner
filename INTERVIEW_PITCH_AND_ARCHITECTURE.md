# 🎙️ Master Interview Preparation & System Architecture Guide

## 📌 Project Name: ZipUrl — Distributed Microservices URL Shortener

---

## 🎯 1. The 30-Second Elevator Pitch

> *"I designed and deployed **ZipUrl**—a production-grade, distributed URL shortener built with two independent microservices (`url-service` for link generation and `redirect-service` for fast redirection) containerized on AWS EC2 behind a host-native Nginx reverse proxy.*
> 
> *The system achieves **sub-15ms redirection latency** by serving short code lookups directly from an in-memory Redis cache-aside layer. To absorb malicious bot probing without hitting PostgreSQL on repeated invalid lookups, I implemented **sentinel-value negative caching (5-minute TTL)** on the redirection path. Storage is backed by **host-native PostgreSQL** with `BIGSERIAL` primary keys, partial indexes, and unique constraints serving as the sole collision arbiter—requiring no distributed locks. The origin EC2 server is secured with **15-year Cloudflare Origin CA certificates** installed in host Nginx in **Full (Strict)** mode over HTTPS Port 443, locked strictly to Cloudflare IPv4 CIDR ranges."*

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
      │ AWS EC2 Host System    │                    │   Cloudflare Pages     │
      │ Native Nginx Proxy     │                    │   React 19 + Vite UI   │
      │ • Port 443 (HTTPS TLS) │                    └────────────────────────┘
      │ • Port 80 (HTTP 301)   │
      └─────────────┬──────────┘
                    │
     ┌──────────────┴───────────────────────────┐
     │ (127.0.0.1:5002)                         │ (127.0.0.1:5003)
     ▼                                          ▼
 ┌───────────────────────┐                  ┌────────────────────────┐
 │  url-service (5002)   │                  │ redirect-service (5003)│
 │  (Docker Container)   │                  │  (Docker Container)    │
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

### 3. Native Nginx Proxying & Cloudflare mTLS Security
- **Cloudflare Origin CA**: Host Nginx uses a 15-year Origin CA certificate (`origin-cert.pem`) in Cloudflare **Full (Strict)** SSL mode over HTTPS Port 443.
- **AWS Security Group Inbound CIDR Whitelisting**: Port 443 and Port 80 access on EC2 is locked down strictly to Cloudflare's published IPv4 CIDR ranges, preventing direct IP bypass attacks.

---

*Prepared for Revanth • Master System Architecture & Interview Pitch Guide*
