# Dönüşümlü Kitap Dağıtım Programı

Sınıftaki kitapların öğrenciler arasında adil, tekrar etmeyecek (bir öğrenci okuduğu kitabı bir daha almaz) ve dönüşümlü bir şekilde dağıtılmasını yöneten tam yığın (full-stack) web uygulaması.

## 🚀 Özellikler

- **Akıllı Dağıtım Algoritması:** Öğrencilerin geçmişte okudukları kitapları analiz edip, Maksimum Bipartite Matching (DFS) algoritması ile anında yeni ve okunmamış kitapları eşleştirir.
- **Yoklama Sistemi:** O gün sınıfta olmayan veya kitabını unutan öğrencileri dağıtıma dahil etmez.
- **İşlem Geçmişi ve Geri Alma (Undo):** Yanlış bir dağıtım yapıldığında tüm kayıtları tek tuşla geri çeker.
- **Öğrenci & Kitap Yönetimi:** Yeni öğrenci/kitap ekleme, silme işlemleri. Silinenler istatistikleri bozmamak için *Soft Delete* (Pasif) yöntemiyle gizlenir.
- **Ayarlar:** Yeni bir eğitim dönemine başlarken tek tıkla (onaylı) tüm veriyi resetleme.

## 🛠 Kullanılan Teknolojiler

- **Backend:** Node.js, Express.js
- **Veritabanı ve ORM:** SQLite, Prisma
- **Frontend:** React, Vite, React Router DOM, Axios
- **Stil/UI:** TailwindCSS, Lucide-React (İkonlar)

## 📁 Klasör Yapısı

```
Kitap_dagitim/
│
├── backend/                  # API ve Veritabanı (Express + Prisma)
│   ├── prisma/               # Veritabanı Modelleri ve sqlite dosyası
│   ├── src/
│   │   ├── controllers/      # İş mantıkları ve API rotaları
│   │   ├── routes/           # Endpoint yönlendirmeleri
│   │   ├── utils/            # Dağıtım Algoritması ve Prisma Client
│   │   └── index.js          # API giriş noktası
│   └── package.json          
│
├── frontend/                 # React UI (Vite)
│   ├── src/
│   │   ├── api/              # Axios API entegrasyonu
│   │   ├── components/       # Kullanılabilir minik componentler (varsa)
│   │   ├── layouts/          # Ana ekran düzenleri ve Sidebar
│   │   ├── pages/            # Ekranlar (Dashboard, Dağıtım, Geçmiş vb.)
│   │   ├── main.jsx          # React renderer 
│   │   └── index.css         # Tailwind global stilleri
│   ├── vite.config.js        
│   └── package.json
│
└── .github/workflows/        # CI/CD (Github Actions test & build)
```

## 💻 Kurulum ve Çalıştırma (Lokal Geliştirme)

1. **Repoyu Klonlayın**
   ```bash
   git clone <REPO_URL>
   cd Kitap_dagitim
   ```

2. **Backend Kurulumu:**
   ```bash
   cd backend
   npm install
   # .env dosyasını oluşturun (Örnek: backend/.env.example)
   npx prisma migrate dev --name init # Veritabanını oluşturur
   npm start # Veya node src/index.js (Port: 5000)
   ```

3. **Frontend Kurulumu (Yeni bir terminalde):**
   ```bash
   cd frontend
   npm install
   # .env dosyasını oluşturun (Örnek: frontend/.env.example)
   npm run dev # (Genelde http://localhost:5173 adresinde açılır)
   ```

## ☁️ Render.com Deploy (Canlıya Alma) Adımları

Uygulamayı [Render.com](https://render.com) üzerinde ücretsiz olarak yayınlamak için aşağıdaki adımları kullanabilirsiniz:

### 1. Web Service (Backend) Kurulumu
- Render Dashboard üzerinden **New > Web Service** seçin ve GitHub reponuzu bağlayın.
- **Root Directory:** `backend`
- **Build Command:** `npm install && npx prisma generate`
- **Start Command:** `node src/index.js`
- **Environment Variables (.env ayarları):**
  - `PORT` : `10000` (veya sunucunun vereceği port)
  - `DATABASE_URL` : `file:/data/sqlite.db` (Disk takılacağı için `/data` dizini kullanılır)
- ⚠️ **ÖNEMLİ (Disk Ekleme):** SQLite veritabanı kullandığımız için kapanmalarda verilerin kaybolmaması gerekir.  
  Ayarlardan **Disks** kısmına gidin:
  - **Name:** Database
  - **Mount Path:** `/data`
  - *Not: Prisma dosyasındaki URL her zaman Diskteki alanla aynı olmalıdır.*

### 2. Static Site (Frontend) Kurulumu
- Render Dashboard üzerinden **New > Static Site** seçin ve aynı GitHub reponuzu bağlayın.
- **Root Directory:** `frontend`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`
- **Environment Variables:**
  - `VITE_API_URL` : *1. adımda oluşturduğunuz Backend Web Service linki (örn: https://kitap-backend.onrender.com/api)*
- *Varsa 'Redirects / Rewrites' ayarlarında `/*` adresini `/index.html` olarak (200 status) yönlendirin (React Router 404 hatası almamak için).*
