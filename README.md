# 🚀 ZipUrl — High-Throughput Microservices URL Shortener

An enterprise-grade, high-performance URL shortener built with **React**, **Node.js/Express 2-Microservice Architecture**, **Host-Native PostgreSQL 16**, **Redis 7**, **Nginx**, **AWS EC2**, and **Cloudflare Pages**.

Designed for ultra-low latency redirection (`< 15ms`), cost-optimized deployment on **Cloudflare Pages** (Frontend - $0/mo) and **AWS EC2** (Backend).

---

## 🏗️ 2-Microservice Architecture Overview

```
                      [ Client Browser ]
                              │
               ┌──────────────┴──────────────┐
               │                             │
    [ Cloudflare Pages ]           [ Cloudflare Edge ]
      (React App CDN)             (Full Strict SSL TLS 1.3)
               │                             │
               └──────────────┬──────────────┘
                              ▼
                   [ Nginx Reverse Proxy ]
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
   [ url-service:5002 ]            [ redirect-service:5003 ]
   (Shortening Engine)             (Redirection Engine)
               │                             │
               └──────────────┬──────────────┘
                              │ (host.docker.internal)
                              ▼
                  [ AWS EC2 Host System ]
                  • PostgreSQL 16 DB (Partial Indexes & BIGSERIAL)
                  • Redis 7 Cache (Sentinel Negative Cache 5-min TTL)
```

---

## 📁 Repository Directory Structure

```text
url_shortner/
├── frontend/                     # React + Vite Glassmorphism Application
│   ├── src/
│   │   ├── components/           # Navbar, UrlShortenerWidget, UrlsTable
│   │   ├── services/             # Axios API Client
│   │   ├── App.jsx
│   │   └── index.css             # Mobile-first Glassmorphism design system
│   └── package.json
│
├── backend/                      # Node.js Microservices
│   ├── services/
│   │   ├── url-service/          # Shortening Engine & Base62 Generator
│   │   └── redirect-service/     # High-Speed 302 Redirection & Sentinel Cache
│   ├── shared/
│   │   ├── database/             # PostgreSQL & Redis Connectors & Migrations
│   │   └── utils/                # Base62 Encoding Engine
│   └── package.json
│
├── infrastructure/
│   └── nginx/                    # Nginx SSL & Microservice Reverse Proxy
│
├── docker-compose.prod.yml       # Production Compose (url-service, redirect-service, nginx)
└── docker-compose.yml            # Development Compose
```

---

## ⚡ Core Engineering Highlights

- **2 Decoupled Microservices**: `url-service` (shortening engine) and `redirect-service` (redirection engine) operate independently for maximum throughput.
- **Host-Native Postgres & Redis**: Microservices run in Docker containers connected directly to host-native PostgreSQL 16 and Redis 7 on EC2 (`host.docker.internal`).
- **Sentinel Negative Caching**: Invalid code lookups are cached in Redis with a 5-minute TTL (`short:invalid:<code>`) to absorb bot probes without touching PostgreSQL.
- **Collision-Free Storage**: Utilizes `BIGSERIAL` primary keys and partial unique indexes (`CREATE UNIQUE INDEX idx_urls_custom_alias ON urls(custom_alias) WHERE custom_alias IS NOT NULL;`).
- **Enterprise SSL & Origin Lockdown**: Nginx uses **15-year Cloudflare Origin CA certificates** in **Full (Strict) SSL Mode** over HTTPS Port 443, locked strictly to Cloudflare IPv4 CIDR ranges.

---

## 🛠️ Quick Local Setup

1. **Clone Repository**:
   ```bash
   git clone https://github.com/revanthkumarp-7328/url_shortner.git
   cd url_shortner
   ```

2. **Install Dependencies**:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Database Migration**:
   ```bash
   cd backend && npm run db:migrate
   ```

4. **Start Microservices**:
   ```bash
   # Terminal 1: URL Shortening Engine (Port 5002)
   npm run start:url

   # Terminal 2: Redirection Engine (Port 5003)
   npm run start:redirect
   ```

---
*Created for Revanth • ZipUrl Microservices Architecture*
