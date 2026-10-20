# 🌸 Lotus & Lion - Luxury Fashion E-Commerce Platform

> A production-ready, scalable luxury clothing brand platform built with Next.js, Node.js/Express, PostgreSQL, and PM2.

## 🎯 Overview

Lotus & Lion is a complete luxury fashion e-commerce platform featuring:

- **Dynamic Collections**: Lotus and Lion collections with separate products and branding
- **Full Admin Control**: CMS, product management, order tracking, and control center
- **Advanced Features**: Inventory management, size/color variant tracking
- **Premium Design**: Warm ivory and luxury aesthetic with smooth animations
- **Production Ready**: Native PostgreSQL database, Redis caching, and PM2/Nginx deployment on KVM2 VPS

## 💻 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, Framer Motion |
| **Backend** | Express 5, Node.js |
| **Database** | PostgreSQL (`pg` connection pool) |
| **Authentication** | JWT + bcrypt authentication |
| **Payments** | Razorpay (INR) |
| **Media/Images** | Local Disk Storage (served via Express/Nginx `/uploads`) |
| **Caching** | Redis (ioredis) |
| **Hosting** | Hostinger KVM2 VPS (PM2 + Nginx) |

## 🚀 Quick Start

### 1️⃣ Prerequisites
- Node.js 20+
- PostgreSQL
- Redis
- Razorpay account (India)

### 2️⃣ Environment Setup
**Backend (`backend/.env`):**
```bash
PORT=5000
NODE_ENV=development
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=lotusandlion
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
```

**Frontend (`frontend/.env.local`):**
```bash
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key
```

### 3️⃣ Initialize Database
```bash
cd backend
npm run db:init     # Creates all PostgreSQL tables and indexes
npm run seed:full   # Seeds initial collections, products, and admin
```

### 4️⃣ Install & Run
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
# Open http://localhost:3000
```

## 📁 Project Structure

```
lotus-lion/
├── frontend/              # Next.js application
│   ├── src/app/          # Pages and routes
│   ├── components/       # React components
│   ├── lib/              # Services and utilities
│   ├── store/            # Zustand stores
│   └── public/           # Static assets
├── supabase/             # Database schema
│   └── migrations/       # SQL migrations
├── SETUP_GUIDE.md        # Detailed setup instructions
└── IMPLEMENTATION_GUIDE.md # Feature checklist
```

## 🚀 Core Features

### For Customers ✨
- Luxurious, responsive design
- Dynamic product browsing
- Persistent shopping cart
- Razorpay payment (INR)
- Blog reading
- Account management

### For Admins 📊
- Analytics dashboard
- Product management (CRUD)
- Collection management
- Blog management
- Order management
- CMS & content editing
- Inventory tracking
- Email notifications

## 📚 Documentation

**Start here**:
1. [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Complete setup with credentials
2. [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Feature checklist

## 💳 Payments

**Razorpay** (India-only):
- INR currency support
- Test and live modes
- Payment verification
- Order creation

## 🖼️ Images

**Cloudinary**:
- Optimized delivery
- Automatic resizing
- CDN caching

# Install frontend dependencies
cd ../frontend
npm install --ignore-scripts # Use ignore-scripts if you encounter build errors
```

### 4. Running Locally
```bash
# Start backend (from /backend)
npm run dev

# Start frontend (from /frontend)
npm run dev
```

## Admin Access
- **Email**: `admin@example.com`
- **Password**: `password123`
- Access the management panel at `/admin/products`.

## Deployment

### Frontend (Vercel)
1. Push the code to GitHub.
2. Connect your repo to Vercel.
3. Set the `Root Directory` to `frontend`.
4. Add environment variables.

### Backend (Render / Heroku / AWS)
1. Deploy the `backend` folder as a separate web service.
2. Ensure `MONGODB_URI` and other secrets are set in the environment.
3. Update `NEXT_PUBLIC_API_URL` on the frontend to point to your live backend URL.

---
Built with excellence by Lotus & Lion.
