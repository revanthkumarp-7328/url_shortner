# 🚀 Production Microservices URL Shortener

An enterprise-grade, high-performance URL shortener application built with **React**, **Node.js/Express Microservices**, **PostgreSQL**, **Redis**, and **Nginx**.

Designed for ultra-low latency redirection (`< 15ms`), cost-optimized deployment on **Cloudflare Pages** (Frontend - $0/mo) and **AWS EC2 + EBS Volume** (Backend - ~$0–$5/mo).

---

## 🏗️ Microservices Architecture Overview

```
                      [ Client Browser ]
                              │
               ┌──────────────┴──────────────┐
               │                             │
    [ Cloudflare Pages ]           [ Cloudflare DNS / WAF ]
  (React Admin Dashboard)             (api.yourdomain.com / s.yourdomain.com)
               │                             │
               └──────────────┬──────────────┘
                              ▼
                   [ Nginx Reverse Proxy ]
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
       [ API Gateway Service ]    [ High-Speed Redirect Engine ]
               │                             │
   ┌───────────┼───────────┐                 │ (Redis L1 Cache O(1))
   ▼           ▼           ▼                 │
[Auth Svc] [URL Svc] [Analytics Svc] <── [Redis Streams]
   │           │           │                 │
   └───────────┴─────┬─────┘                 │
                     ▼                       ▼
            [ PostgreSQL (Docker/EC2) ]     [ Redis (Docker/EC2) ]
                     │                       │
                     └───────────┬───────────┘
                                 ▼
                     [ AWS EBS Persistent Volume ]
```

---

## 📁 Repository Directory Structure

```
url_shortner/
├── frontend/                     # React + Vite Glassmorphism Application
│   ├── src/
│   │   ├── components/           # Navbar, AuthModal, UrlShortenerWidget, DashboardAnalytics, UrlsTable
│   │   ├── services/             # Axios API Client
│   │   ├── App.jsx
│   │   └── index.css             # Glassmorphism design system
│   ├── wrangler.toml             # Cloudflare Pages config
│   └── package.json
│
├── backend/                      # Node.js Microservices
│   ├── api-gateway/              # Express API Gateway, Rate Limiting & JWT Auth
│   ├── services/
│   │   ├── auth-service/         # User auth, JWT & API Key management
│   │   ├── url-service/          # Base62 URL shortener & CRUD operations
│   │   ├── redirect-service/     # Sub-15ms Redirection & Async Click Queuing
│   │   └── analytics-service/    # Redis Stream Worker & GeoIP/UA Analytics API
│   ├── shared/
│   │   ├── database/
│   │   │   ├── migrations/       # Version-controlled SQL database schema
│   │   │   ├── migrate.js        # Automated migration runner
│   │   │   ├── db.js             # PostgreSQL Pool Connection
│   │   │   └── redis.js          # Redis Client Helper
│   │   └── utils/
│   │       └── base62.js         # Base62 encoder
│   ├── Dockerfile
│   └── package.json
│
├── infrastructure/
│   └── nginx/
│       └── nginx.conf            # Nginx Reverse Proxy Ingress config
│
├── docker-compose.yml            # Local development orchestration
├── docker-compose.prod.yml       # Production AWS EC2 deployment orchestration
└── README.md
```

---

## ⚡ Quick Start: Local Development

### 1. Prerequisites
- [Docker & Docker Compose](https://www.docker.com/) installed on your machine.
- Node.js 20+

### 2. Run Entire Stack with Docker Compose
```bash
# Clone repository
git clone <your-repo-url>
cd url_shortner

# Spin up Postgres, Redis, Migration runner, API Gateway, 4 Microservices & Nginx
docker compose up --build
```

### 3. Access Local Services
- **React Frontend**: `http://localhost:5173` (Run `cd frontend && npm install && npm run dev`)
- **API Gateway**: `http://localhost:5000`
- **Short Redirect Engine**: `http://localhost:5003/:code`
- **Nginx Ingress**: `http://localhost:80`

---

## ☁️ Step-by-Step AWS & Cloudflare Production Deployment

### Phase 1: Deploy Frontend on Cloudflare Pages ($0/mo)
1. Push this repository to GitHub/GitLab.
2. Go to **Cloudflare Dashboard ➔ Workers & Pages ➔ Create Page**.
3. Connect your Git Repository:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Build Output Directory: `dist`
   - Root Directory: `frontend`
4. Add Environment Variable:
   - `VITE_API_BASE_URL` = `https://api.yourdomain.com/api/v1`

---

### Phase 2: Deploy Backend Microservices on AWS EC2 (~$0–$5/mo)
1. **Launch EC2 Instance**:
   - Instance Type: `t4g.small` or `t3.micro` (AWS Free Tier eligible).
   - OS: Ubuntu 24.04 LTS.
   - Security Group Rules: Allow Port `22` (SSH), Port `80` (HTTP), Port `443` (HTTPS).
2. **Attach EBS Persistent Volume**:
   - Create a 10GB–20GB EBS `gp3` volume in AWS Console.
   - Attach it to your EC2 instance and format/mount to `/mnt/postgres_data`:
     ```bash
     sudo mkfs -t ext4 /dev/xvdf
     sudo mkdir -p /mnt/postgres_data
     sudo mount /dev/xvdf /mnt/postgres_data
     ```
3. **Install Docker & Clone Code on EC2**:
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose-v2 git
   git clone <your-repo-url>
   cd url_shortner
   ```
4. **Launch Production Containers**:
   ```bash
   # Set production secrets
   export JWT_SECRET="your_production_jwt_secret_key"
   export DOMAIN_NAME="yourdomain.com"
   
   # Start production microservices
   docker compose -f docker-compose.prod.yml up -d --build
   ```

---

### Phase 3: Cloudflare DNS Setup
In Cloudflare DNS Manager for `yourdomain.com`, add the following DNS records:

| Type | Name | Target / IP Value | Proxy Status | Description |
| :--- | :--- | :--- | :--- | :--- |
| **CNAME** | `app` | `your-app.pages.dev` | 🟠 Proxied | React Admin Dashboard (`app.yourdomain.com`) |
| **A** | `api` | `YOUR_AWS_EC2_PUBLIC_IP` | 🟠 Proxied | Express API Gateway (`api.yourdomain.com`) |
| **A** | `s` | `YOUR_AWS_EC2_PUBLIC_IP` | 🟠 Proxied | High-Speed Redirection Engine (`s.yourdomain.com`) |

---

## 🧪 Database Migrations
Migrations run automatically on container startup via `npm run db:migrate`.

To create a new database migration:
1. Add a new timestamped `.sql` file inside `backend/shared/database/migrations/` (e.g. `002_add_tags_table.sql`).
2. Run `npm run db:migrate` locally or deploy updates to EC2.

---

## 🔒 Features Included
- **Base62 URL Shortener**: Collision-safe encoding algorithm.
- **Custom Slugs**: Custom branded aliases (e.g. `s.yourdomain.com/my-brand`).
- **Password Protection**: Optional bcrypt-hashed password protection for short links.
- **Expiration Dates**: Auto-expiring links.
- **QR Code Generator**: Downloadable QR codes for every short link.
- **Real-Time Analytics**: Time-series click counts, GeoIP location tracking, device/browser distribution, and referrer tracking.
- **JWT & API Keys**: Token authentication and developer API key generation.
