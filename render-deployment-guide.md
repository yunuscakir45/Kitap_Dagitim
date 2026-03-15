# 🚀 Kitap Dağıtım Sistemi - Canlıya Alma (Deployment) Rehberi

Bu rehber, projeyi **tamamen ücretsiz** olarak [Render.com](https://render.com) üzerinde yayına almayı ve veritabanı olarak **Supabase (PostgreSQL)** kullanmayı adım adım anlatır.

Render'ın ücretsiz paketinde disk (storage) desteği yoktur. Yani sunucu her yeniden başladığında (uyuduktan sonra uyanınca) SQLite veritabanı dosyası silinir ve verileriniz kaybolur. Bu yüzden ücretsiz ve çok güçlü bir bulut veritabanı olan **Supabase** (PostgreSQL altyapısı) kullanacağız. MongoDB Atlas da kullanılabilirdi, ancak Prisma hali hazırda yetenekli bir SQL ORM'i olduğu için MongoDB yerine Supabase geçişi çok daha kolay ve mantıklıdır.

---

## BÖLÜM 1: Supabase (Ücretsiz Veritabanı) Kurulumu

1. [Supabase](https://supabase.com/)'e gidin ve GitHub hesabınızla giriş yapın.
2. **"New Project"** butonuna tıklayın.
3. Proje adını girin (Örn: `kitap-dagitim-db`).
4. Güçlü bir veritabanı şifresi belirleyin (bu şifreyi bir yere not alın, daha sonra URL içinde kullanacağız).
5. Bölge (Region) olarak **Frankfurt (EU Central)** seçin (Türkiye'ye en yakın ve hızlı olan budur).
6. **"Create New Project"** butonuna tıklayın. Projenin ayağa kalkması birkaç dakika sürebilir.
7. Proje hazır olduğunda, sol menüden dişli çark butonuna (Project Settings) tıklayın ve **"Database"** sekmesine gidin.
8. **"Connection string"** bölümünü bulun ve **URI** (veya Node.js) sekmesindeki linki kopyalayın.
   - Örnek format: `postgresql://postgres.[PROJE_ID]:[ŞİFRENİZ]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`
   - Kopyaladığınız bu linkte `[YOUR-PASSWORD]` yazan yere kendi şifrenizi (köşeli parantezler OLMADAN) yazacaksınız.

---

## BÖLÜM 2: Projeyi Supabase'e Uyarlama (Kod Değişiklikleri)

Geçiş yapmak için projede birkaç çok ufak satırı değiştirmemiz gerekiyor (SQLite'dan PostgreSQL'e).

### Adım 1: Prisma Şemasını Güncellemek
[backend/prisma/schema.prisma](file:///c:/Users/Sadullah/Desktop/Projects/Kitap_dagitim/backend/prisma/schema.prisma) dosyasını açın. En üstteki `datasource db` kısmını şu şekilde değiştirin:

```prisma
datasource db {
  provider = "postgresql" // "sqlite" yazan yeri "postgresql" yapın
  url      = env("DATABASE_URL")
}
```

### Adım 2: Geçiş (Migration) Dosyalarını Silmek ve Yeniden Oluşturmak
SQLite ile önceden oluşturulmuş migration dosyaları PostgreSQL ile uyumsuzdur.
1. `backend/prisma/migrations/` klasörünün **içindeki her şeyi** (klasörleri) silin.
2. `backend/.env` dosyanızı açın ve `DATABASE_URL` değerini Supabase'den aldığınız **şifreli link** ile değiştirin:
   `DATABASE_URL="postgresql://postgres.[PROJE_ID]:GizliSifrem123@aws-0-eu-central-1.../postgres"`

### Adım 3: Tabloları Supabase'e Göndermek
Terminali açın, `backend` klasörüne girin ve şu kodu çalıştırarak veritabanı tablolarını Supabase'de oluşturun:
```bash
npx prisma migrate dev --name init_postgres
```
*(Bu işlemden sonra tablolarınız Supabase tarafında hazır hale gelecektir.)*

Artık tüm değişiklikleri GitHub'a pushlayabilirsiniz:
```bash
git add .
git commit -m "Veritabani olarak Supabase'e (PostgreSQL) gecildi"
git push origin main
```

---

## BÖLÜM 3: Render (Backend - API) Kurulumu

1. [Render.com](https://render.com/)'a gidin ve GitHub ile giriş yapın.
2. Sağ üstten **New > Web Service** seçin.
3. Reponuz olan `Kitap_Dagitim`'ı bulun ve "Connect" deyin.
4. Ayarları şu şekilde doldurun:
   - **Name:** `kitap-dagitim-api` (veya istediğiniz bir isim)
   - **Region:** Frankfurt (EU Central)
   - **Root Directory:** `backend` 
   - **Environment:** `Node`
   - **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command:** `node src/index.js`
   - **Instance Type:** Free (Ücretsiz)
5. Sayfanın en altındaki **Environment Variables (Gelişmiş Ayarlar)** bölümünü açın ve şu değişkeni ekleyin:
   - **Key:** `DATABASE_URL`
   - **Value:** `postgresql://postgres.[PROJE_ID]:[ŞİFRENİZ]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true` (Not: Prisma ile pooler kullanırken portun 6543 ve sonuna ?pgbouncer=true olması önerilir, supabase dashboard'dan doğrudan "Transaction" modlu Prisma linkini kopyalayabilirsiniz).
6. **"Create Web Service"** butonuna tıklayın. 
7. Birkaç dakika sonra konsolda "Your service is live 🎉" yazısını göreceksiniz. Sayfanın sol üstündeki linki (örn: `https://kitap-dagitim-api.onrender.com`) kopyalayın.

---

## BÖLÜM 4: Render (Frontend - React) Kurulumu

1. Render anasayfasına dönün ve bu kez **New > Static Site** seçin.
2. Yine aynı `Kitap_Dagitim` reposunu seçin.
3. Ayarları şu şekilde doldurun:
   - **Name:** `kitap-dagitim-ui`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Sayfanın altındaki **Environment Variables** bölümünü açın ve şu değişkeni ekleyin:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://kitap-dagitim-api.onrender.com/api` *(Bi önceki adımda backend için kopyaladığınız linkin sonuna `/api` ekleyin)*
5. **"Create Static Site"** butonuna tıklayın.
6. **(Önemli!) Yönlendirme Ayarı:** React Router'ın düzgün çalışması için `Static Site` ayarlarınıza gidip sol menüden **Redirects/Rewrites** menüsünü açın.
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - **Action:** `Rewrite`
   - Save Changes deyin.

## Tebrikler! 🎉
Her iki servis de "Live" durumuna geçtikten sonra, Frontend `kitap-dagitim-ui.onrender.com` linkine tıklayarak uygulamanıza ücretsiz bir şekilde, veri kaybı riski olmadan internet üzerinden tam erişim sağlayabilirsiniz.
