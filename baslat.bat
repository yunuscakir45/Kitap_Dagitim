@echo off
chcp 65001 > nul
title Kitap Dagitim Sistemi Baslatici

echo ===================================================
echo     Kitap Dagitim Programi - V1.0.0
echo ===================================================
echo.
echo Moduller kontrol ediliyor...

cd backend
if not exist "node_modules\" (
    echo [Backend] Gerekli npm paketleri yukleniyor...
    call npm install
)
if not exist "node_modules\@prisma\client\" (
    echo [Backend] Prisma Client olusturuluyor...
    call npx prisma generate
)
cd ../frontend
if not exist "node_modules\" (
    echo [Frontend] Gerekli npm paketleri yukleniyor...
    call npm install
)
cd ..

echo.
echo [1/2] Backend sunucusu baslatiliyor (Port: 5000)...
start "Kitap Dagitim - Backend (Veritabani Modulu)" cmd /k "cd backend && npx prisma db push && npm start"

timeout /t 2 /nobreak > nul

echo [2/2] Frontend Kullanici Arayuzu baslatiliyor...
start "Kitap Dagitim - Frontend (Arayuz Modulu)" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo Sistem basariyla baslatildi! 
echo.
echo - Ekranda 2 adet siyah pencere (terminal) acilmis olmalidir.
echo - Saglikli calismasi icin onlari kapatmayiniz!
echo - Bu pencereyi kapatabilirsiniz.
echo ===================================================
pause
