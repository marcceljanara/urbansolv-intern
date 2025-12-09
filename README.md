# Urbansolv Backend - GIS Data Management

Backend service untuk mengelola data GIS berbasis shapefile dengan PostgreSQL + PostGIS.

## 🚀 Features

- ✅ **Upload Shapefile** - Upload file .zip berisi shapefile (.shp, .shx, .dbf, .prj)
- ✅ **Read GIS Data** - Menampilkan data dalam format GeoJSON FeatureCollection
- ✅ **Update Features** - Update properties dan geometry menggunakan PostGIS
- ✅ **Delete Features** - Hapus satu atau semua features
- ✅ **TypeScript** - Fully typed dengan TypeScript
- ✅ **Modular Architecture** - Clean separation of concerns

## 📦 Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL + PostGIS
- **File Processing**: Multer, Unzipper, Shapefile parser

## 🛠️ Setup & Installation

### 1. Prerequisites

- Node.js (v18+)
- PostgreSQL (v14+)
- PostGIS extension

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

```bash
# Create database
createdb urbansolv

# Initialize schema and PostGIS
npm run db:init
```

Atau manual:

```bash
psql -U postgres -d urbansolv -f scripts/init-db.sql
```

### 4. Environment Variables

Copy `.env.example` ke `.env`:

```bash
cp .env.example .env
```

Edit `.env`:

```
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://username:password@localhost:5432/urbansolv_db
UPLOAD_DIR=./uploads
```

### 5. Run Development Server

```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

### 6. Build for Production

```bash
npm run build
npm start
```

## 📡 API Endpoints

### Upload Shapefile

```http
POST /api/gis/upload
Content-Type: multipart/form-data

Body: file (shapefile.zip)
```

**Response:**
```json
{
  "success": true,
  "message": "Shapefile uploaded and processed successfully",
  "data": {
    "featuresCount": 10,
    "geometryTypes": {
      "LineString": 8,
      "MultiLineString": 2,
    }
  }
}
```

### Get All Features

```http
GET /api/gis/features
```

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "id": 1,
        "properties": {
          "KELAS": 11,
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[...]]
        }
      }
    ]
  }
}
```

### Get Feature by ID

```http
GET /api/gis/features/:id
```

### Update Feature

```http
PUT /api/gis/features/:id
Content-Type: application/json

Body:
{
  "properties": {
    "Kelas": 11
  },
  "geometry": {
    "type": "LineString",
    "coordinates": [106.8, -6.2]
  }
}
```

### Delete Feature

```http
DELETE /api/gis/features/:id
```

### Delete All Features

```http
DELETE /api/gis/features
```

### Get Statistics

```http
GET /api/gis/stats
```

## 📁 Project Structure

```
urbansolv-intern/
├── src/
│   ├── app.ts                  
│   ├── server.ts              
│   ├── config/
│   │   └── db.ts               
│   ├── controllers/
│   │   └── gis.controller.ts   
│   ├── services/
│   │   └── gis.service.ts      
│   ├── routes/
│   │   └── gis.routes.ts               
│   ├── middleware/
│   │   └── upload.ts           
│   ├── utils/
│   │   ├── file.ts             
│   │   ├── shapefile.ts        
│   │   └── geojson.ts          
│   └── types/
│       └── geojson.d.ts        
├── scripts/
│   └── init-db.sql             
├── .env.example
├── package.json
└── tsconfig.json
```

## 🧪 Testing with cURL

### Upload Shapefile

```bash
curl -X POST http://localhost:3000/api/gis/upload \
  -F "file=@path/to/shapefile.zip"
```

### Get All Features

```bash
curl http://localhost:3000/api/gis/features
```

### Update Feature

```bash
curl -X PUT http://localhost:3000/api/gis/features/1 \
  -H "Content-Type: application/json" \
  -d '{
    "properties": {
      "KELAS": 11
    }
  }'
```

### Delete Feature

```bash
curl -X DELETE http://localhost:3000/api/gis/features/1
```

## 🔍 PostGIS Functions Used

- `ST_GeomFromGeoJSON()` - Convert GeoJSON to PostGIS geometry
- `ST_AsGeoJSON()` - Convert PostGIS geometry to GeoJSON
- `ST_SetSRID()` - Set spatial reference system (4326 = WGS84)

## 📚 Database Schema

```sql
CREATE TABLE gis_features (
    id SERIAL PRIMARY KEY,
    properties JSONB NOT NULL,
    geometry GEOMETRY(Geometry, 4326) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## ⚠️ Notes

- Maksimal ukuran file upload: 50MB
- Hanya file .zip yang diperbolehkan
- Shapefile harus berisi: .shp, .shx, .dbf, .prj
- Coordinate system: WGS84 (EPSG:4326)

## 👨‍💻 Author

Marccel Janara

## 📄 License

ISC