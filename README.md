# Analytics Service

A high-performance website analytics service built with **Node.js**, **Express**, **Redis**, and **MongoDB**. Designed for **high-volume event ingestion** with **sub-5ms response times** and fast analytics aggregation.

---

## 🏗 Architecture Decision

### Asynchronous Processing with Redis Queue

#### **Why Redis for the Queue?**

* **Performance**: In-memory operations give microsecond latency
* **Durability**: Redis persistence ensures events survive restarts
* **Scalability**: Multiple workers can consume from the queue
* **Simplicity**: Uses fast RPUSH/LPOP list operations

#### **How the System Works**

1. **Ingestion API** receives events → instantly pushes them to Redis
2. **Worker Service** processes queued events every 2 seconds → writes to MongoDB
3. **Reporting API** uses MongoDB to serve analytics
4. **Loose coupling** ensures database load never slows ingestion

#### **Benefits**

* Super-fast ingestion (<5ms)
* Events stay in Redis until processed
* Add more workers to scale
* Built-in health and queue monitoring

---

## 🗄 Database Schema

### **Events Collection**

```javascript
{
  site_id: String,
  event_type: String, 
  path: String,
  user_id: String,
  timestamp: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### **Optimized Indexes**

* `site_id`
* `timestamp`
* `user_id`
* `{ site_id: 1, timestamp: 1 }`
* `{ site_id: 1, event_type: 1 }`

---

## Setup Instructions

### **Prerequisites**

* Node.js 16+
* Redis
* MongoDB

---

### **1️ Install Dependencies**

```bash
git clone <repository-url>
cd analytics-service
npm install
```

---

### **2️ Start Redis & MongoDB**

#### **macOS**

```bash
brew install redis
brew services start redis

brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### **Ubuntu/Linux**

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis

wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org-6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

#### **Windows**

* Redis: [https://github.com/microsoftarchive/redis/releases](https://github.com/microsoftarchive/redis/releases)
* MongoDB: [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)

---

### **3️ Verify Services**

```bash
redis-cli ping     # PONG
mongosh --eval "db.adminCommand('ismaster')"
```

---

### **4️ Start the Analytics Service**

```bash
npm run dev   # Development
npm start     # Production
```

**Expected Output**

```
Starting Analytics Service with Redis...
Initializing database connections...
Successfully connected to Redis
Connected to MongoDB
All database connections established!
Background queue processor started
Analytics Service running on port 3000
```

---

## API Usage

---

### **POST /event – Ingest Event (FAST)**

#### **cURL**

```bash
curl -X POST http://localhost:3000/event \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": "site-abc-123",
    "event_type": "page_view",
    "path": "/pricing",
    "user_id": "user-xyz-789",
    "timestamp": "2025-11-12T19:30:01Z"
  }'
```

#### **PowerShell**

```powershell
$body = @{
    site_id = "site-abc-123"
    event_type = "page_view"
    path = "/pricing"
    user_id = "user-xyz-789"
    timestamp = "2025-11-12T19:30:01Z"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/event" -Method POST -Headers @{"Content-Type" = "application/json"} -Body $body
```

#### **Example Response**

```json
{
  "status": "success",
  "message": "Event queued for processing",
  "event_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "queue_time": "3ms",
  "queue_length": 5
}
```

---

### **GET /stats – Fetch Analytics**

```bash
curl "http://localhost:3000/stats?site_id=site-abc-123&date=2025-11-12"
```

**Example Response**

```json
{
  "site_id": "site-abc-123",
  "date": "2025-11-12",
  "total_views": 1450,
  "unique_users": 212,
  "top_paths": [
    {"path": "/pricing", "views": 700},
    {"path": "/blog/post-1", "views": 500},
    {"path": "/", "views": 250}
  ],
  "generated_at": "2024-01-15T10:30:00.000Z"
}
```

---

### **GET /health**

```bash
curl http://localhost:3000/health
```

### **GET /queue-stats**

```bash
curl http://localhost:3000/queue-stats
```

---

## Testing

### **Run Full Test Suite**

```bash
.\test-analytics.ps1
```

### **Includes Tests For**

* Health checks
* Event validation
* Invalid event rejection
* Bulk ingestion performance
* Aggregation accuracy
* Queue monitoring

---

## Performance Metrics

* **Ingestion**: < 5ms
* **Events/sec**: 1000+
* **Non-blocking async pipeline**
* **Indexed MongoDB queries**
* **Low memory footprint**

---

## Monitoring Endpoints

* `/health` – Service status
* `/queue-stats` – Queue length + processing metrics

---

## Deployment Guide

1. Fill environment variables in `.env`
2. Use **PM2** for production

   ```bash
   pm2 start server.js
   ```
3. Enable Redis AOF persistence
4. Use MongoDB replica sets for HA
5. Add rate limiting + auth layer

---

## Troubleshooting

### Redis Issues

* Ensure Redis is running
* Verify Redis URL in `.env`

### MongoDB Issues

* Ensure Mongo is running
* Check connection string

### Port Conflict

* Change `PORT` in `.env`

### Queue Not Processing

* Check `/queue-stats`
* Ensure worker is running

---

## License

MIT License – Free to use for learning and production.

---


