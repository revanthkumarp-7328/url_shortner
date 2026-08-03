# 🎙️ Master Interview Preparation & System Architecture Guide

## 📌 Project Name: ZipUrl — Distributed Microservices URL Shortener

---

## 🎯 1. The 30-Second Elevator Pitch

> *"I designed and deployed **ZipUrl**—a production-grade, distributed URL shortener built with an event-driven microservices architecture using Node.js, Express, PostgreSQL, Redis Streams, Nginx, Docker Compose, AWS EC2, and Cloudflare Pages.*
> 
> *The system achieves **sub-15ms redirection latency** by serving short code lookups directly from an in-memory Redis cache. Click analytics are logged asynchronously using **Redis Streams** and processed by a background worker into PostgreSQL without blocking the HTTP redirection response. The entire microservice backend is containerized, reverse-proxied with Nginx on AWS EC2, and secured end-to-end with **15-year Cloudflare Origin CA SSL certificates** in **Full (Strict)** mode over HTTPS Port 443."*

---

## 🏗️ 2. System Architecture Diagram

```
                              ┌────────────────────────┐
                              │  Client / Browser      │
                              └───────────┬────────────┘
                                          │
                                          ▼
                              ┌────────────────────────┐
                              │    Cloudflare Edge     │
                              │  (DNS, SSL, DDoS, CDN) │
                              └───────────┬────────────┘
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   │ (HTTPS Proxy)                               │ (Static Frontend Hosting)
                   ▼                                             ▼
     ┌────────────────────────┐                    ┌────────────────────────┐
     │ AWS EC2 (Elastic IP)   │                    │   Cloudflare Pages     │
     │ Nginx Reverse Proxy    │                    │   React 19 + Vite UI   │
     └─────────────┬──────────┘                    └────────────────────────┘
                   │
    ┌──────────────┴───────────────────────────┐
    │                                          │
    ▼ (api.zipurl.dpdns.org)                   ▼ (s.zipurl.dpdns.org)
┌───────────────────────┐                  ┌────────────────────────┐
│   API Gateway (5000)  │                  │ Redirect Engine (5003) │
└───────────┬───────────┘                  └───────────┬────────────┘
            │                                          │
  ┌─────────┼───────────┐                   ┌──────────┴──────────┐
  ▼         ▼           ▼                   ▼                     ▼
┌───────┐ ┌───────┐ ┌───────────┐     ┌───────────┐         ┌───────────┐
│ Auth  │ │ URL   │ │ Analytics │     │ Redis     │         │ Redis     │
│ (5001)│ │ (5002)│ │ (5004)    │     │ Cache     │         │ Streams   │
└───┬───┘ └───┬───┘ └─────┬─────┘     └─────┬─────┘         └─────┬─────┘
    │         │           │                 │                     │
    └─────────┴─────┬─────┴─────────────────┘                     │
                    ▼                                             ▼
          ┌───────────────────┐                         ┌───────────────────┐
          │  PostgreSQL 16 DB │                         │ Analytics Worker  │
          └───────────────────┘                         └───────────────────┘
```

---

## ⚡ 3. Detailed Microservices Breakdown

| Microservice | Port | Primary Responsibility | Key Technologies |
| :--- | :--- | :--- | :--- |
| **API Gateway** | `5000` | Single entrypoint for REST APIs, CORS control, rate-limiting, and request proxying. | Express, `http-proxy-middleware`, `express-rate-limit` |
| **Auth Service** | `5001` | User registration, authentication, BCrypt password hashing, JWT issuance, and API Key (`sk_live_*`) management. | Express, JWT, BCrypt, PostgreSQL |
| **URL Service** | `5002` | Short URL creation, Base62 code generation, custom aliases, password protection, expiration, and Redis cache warming. | Express, Base62, Redis, PostgreSQL |
| **Redirect Engine** | `5003` | Sub-15ms HTTP 302 redirections, password verification, expiration checks, and asynchronous Redis Stream click queuing. | Express, Redis, PostgreSQL |
| **Analytics Service** | `5004` | Asynchronous Redis Stream consumer worker, MaxMind GeoIP parsing, User-Agent device/browser parsing, and real-time dashboard APIs. | Express, Redis Streams, `geoip-lite`, `ua-parser-js` |

---

## 🔄 4. End-to-End Workflows (How It Works Under the Hood)

### A. Short URL Creation Workflow
1. User submits a long URL (`https://example.com/long-page`) via React UI.
2. Request hits `API Gateway` (`POST /api/v1/urls`) ➔ Proxied to `URL Service`.
3. `URL Service` inserts record into PostgreSQL `urls` table to obtain auto-incrementing ID.
4. Converts Database ID to a unique 6-character **Base62 short code** (e.g. ID `12345678` ➔ `WHq3sK`).
5. **Pre-warms Redis Cache**: Sets `short:WHq3sK` ➔ JSON payload in Redis.
6. Returns `https://s.zipurl.dpdns.org/WHq3sK` to user.

### B. High-Speed Redirection Workflow (Sub-15ms)
1. Visitor clicks `https://s.zipurl.dpdns.org/WHq3sK`.
2. Cloudflare forwards request with `CF-Connecting-IP` header to EC2 Nginx ➔ Proxied to `Redirect Engine`.
3. `Redirect Engine` queries Redis (`GET short:WHq3sK`).
   - **Cache Hit**: Instantly retrieves original URL in **<2ms**.
   - **Cache Miss**: Queries PostgreSQL ➔ Sets Redis cache with 24-hour expiration (`EX 86400`).
4. **Fire-and-Forget Analytics Queuing**: Pushes click metadata (IP, User-Agent, Referrer, Timestamp) to Redis Stream (`stream:click_events`) asynchronously (`XADD`).
5. Returns **HTTP 302 Redirect** immediately to visitor without waiting for database writes.

### C. Asynchronous Analytics Processing Workflow
1. `Analytics Service` runs an isolated background consumer group loop using Redis `XREADGROUP`.
2. Consumes unacknowledged click events from `stream:click_events`.
3. Resolves GeoIP location (`Country`, `City`) using MaxMind GeoIP lookup.
4. Parses User-Agent header into `Browser`, `OS`, and `Device Type`.
5. Inserts parsed record into PostgreSQL `clicks` table.
6. Sends `XACK` to Redis Stream to confirm event processing.
7. React frontend polls `GET /api/v1/analytics/dashboard-summary` every 3 seconds for live chart updates.

### D. ⏱️ TTL (Time-To-Live) Strategy Across Architecture
ZipUrl implements TTL at 3 distinct architectural layers:

1. **Redis Cache TTL (`EX 86400`)**:
   - Short code lookup records (`short:<code >`) in Redis expire automatically after **24 hours (86,400 seconds)**.
   - Prevents RAM bloat and ensures inactive links are automatically evicted from Redis memory. If a link is clicked after 24h, the Redirect Engine fetches from PostgreSQL and re-warms the cache.

2. **Custom Link Expiration TTL (`expires_at`)**:
   - When users create links with custom expiration dates, `Redirect Engine` evaluates `expiresAt`.
   - If `Date.now() >= expiresAt`, the system responds with **HTTP 410 Gone** and renders a glassmorphism `⏳ Short Link Expired` page.

3. **Nginx Container DNS Resolution TTL (`valid=10s`)**:
   - In `infrastructure/nginx/nginx.conf`, Docker container IP resolution has a **10-second TTL** (`resolver 127.0.0.11 valid=10s;`).
   - Ensures Nginx dynamically updates microservice IP addresses during container restarts without causing 502 Bad Gateway errors.

---

## 💡 5. Top 10 Technical Interview Questions & Answers

### Q1: Why did you choose Microservices over a Monolith?
> **Answer**: *"A URL shortener has asymmetric traffic patterns: redirection requests outnumber URL creation requests by 100:1. Separating the **Redirect Engine** into an isolated microservice allows us to scale it horizontally independently of the Auth or Analytics services, ensuring zero performance impact on redirections during heavy analytics read/write workloads."*

---

### Q2: How do you handle short code collisions?
> **Answer**: *"Instead of random string generation which degrades performance due to database collision checks (`SELECT EXISTS`), I used a **Base62 Encoding Scheme** mapped to PostgreSQL's sequential auto-incrementing primary keys. Because every auto-incrementing integer is mathematically unique, Base62 encoding guarantees 100% collision-free short codes without requiring database collision checks."*

---

### Q3: How do you achieve sub-15ms redirection latency?
> **Answer**: *"Three factors:*
> 1. *In-Memory Caching: Short codes are pre-warmed in Redis upon creation (`short:<code >`).*
> 2. *Asynchronous Event Streaming: Click logging is decoupled from the HTTP response loop using Redis Streams (`XADD`). The redirect engine responds immediately with an HTTP 302 location header without blocking on PostgreSQL writes.*
> 3. *Edge CDN Proxying: Cloudflare handles SSL termination and keeps TCP connections alive."*

---

### Q4: Why did you use Redis Streams instead of RabbitMQ or Kafka?
> **Answer**: *"Since Redis was already in our stack for short-code caching, using **Redis Streams** gave us built-in consumer groups (`XGROUP`), message persistence, and acknowledge semantics (`XACK`) with zero additional infrastructure overhead or memory cost compared to managing a separate Kafka or RabbitMQ cluster."*

---

### Q5: How did you handle Nginx 502 Bad Gateway errors during container restarts?
> **Answer**: *"By default, Nginx resolves upstream hostnames once at startup and caches the resolved IP address. When Docker Compose recreated microservice containers, internal IP addresses changed, causing Nginx to proxy traffic to stale IPs.*
> 
> *I fixed this by configuring Docker's embedded DNS resolver (`resolver 127.0.0.11 valid=10s;`) and using dynamic variable upstreams (`set $redirect_upstream http://redirect-service:5003; proxy_pass $redirect_upstream;`), forcing Nginx to dynamically re-resolve container IPs every 10 seconds."*

---

### Q6: How do you capture accurate visitor IPs behind Cloudflare and Nginx?
> **Answer**: *"Multi-layer reverse proxies rewrite request socket IPs. To capture the true visitor IP for GeoIP lookups:*
> 1. *Configured Nginx to pass Cloudflare's `CF-Connecting-IP` header (`proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;`).*
> 2. *Updated microservices to parse `CF-Connecting-IP` first, falling back to the first IP in `X-Forwarded-For` comma chains (`rawIp.split(',')[0].trim()`)."*

---

### Q7: How do you handle database migrations in a containerized environment?
> **Answer**: *"I built a dedicated migration container (`migration`) in Docker Compose that runs before microservices start. It maintains a `schema_migrations` tracking table in PostgreSQL, executes new SQL files sequentially inside atomic transactions (`BEGIN ... COMMIT`), and exits cleanly (`condition: service_completed_successfully`)."*

---

### Q8: How is authentication and security handled?
> **Answer**: *"The system supports dual-authentication:*
> 1. *JWT Tokens: Issued upon login for session authentication in the web dashboard.*
> 2. *API Keys (`sk_live_*`): Provided for programmatic developer access via Bearer headers.*
> 
> *Passwords are hashed using BCrypt (`10 rounds`). API Gateway applies global IP rate-limiting (`100 reqs/15 mins`) to protect against brute-force and DDoS attacks."*

---

### Q9: How is frontend deployment separated from backend microservices?
> **Answer**: *"The React 19 single-page application is built with Vite and deployed directly to **Cloudflare Pages** for global CDN edge distribution. The frontend communicates with backend microservices via REST APIs hosted on AWS EC2 (`api.zipurl.dpdns.org`) using CORS credentials and dynamic environment fallback handling."*

---

### Q10: How would you scale this system to 1 Billion links?
> **Answer**:
> 1. **Database Sharding**: Partition PostgreSQL `urls` and `clicks` tables by hash of `user_id` or `short_code`.
> 2. **Redis Cluster**: Deploy a Redis Cluster with LRU eviction policy to cache the top 20% most active short links.
> 3. **Multiple Worker Processes**: Scale `analytics-service` consumer instances using Redis Stream Consumer Groups to parallelize click ingestion.
> 4. **AWS Auto-Scaling**: Deploy Nginx and Redirect Engine instances across multiple Availability Zones behind an AWS Application Load Balancer.

---

## 🎯 6. Cheat Sheet for Interview Day

| Topic | Key Terminology to Use |
| :--- | :--- |
| **Architecture** | Event-Driven Microservices, Reverse Proxy, Asynchronous Streaming |
| **Encoding** | Base62 Algorithm, Collision-Free Sequential ID Mapping |
| **Performance** | In-Memory Redis Cache, Sub-15ms Latency, Fire-and-Forget Logging |
| **Reliability** | Docker Embedded DNS Resolver, Consumer Groups (`XREADGROUP`), Atomic DB Migrations |
| **Security** | Cloudflare DDoS Protection, CORS Credentials, BCrypt Hashing, Rate Limiting |
| **DevOps** | Docker Compose Orchestration, AWS EC2 Elastic IP, Cloudflare Pages CDN |

---
*Prepared for Revanth • Master System Architecture & Interview Pitch Guide*
