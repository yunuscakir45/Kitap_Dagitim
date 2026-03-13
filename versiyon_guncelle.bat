@echo off
chcp 65001 > nul
title Versiyon Guncelleme Araci

echo ===================================================
echo     Kitap Dagitim Sistemi Versiyon Guncelleme
echo ===================================================
echo Mevcut Versiyon:
cd backend
npm pkg get version
cd ..

echo.
set /p new_version="Yeni versiyon numarasini basinda V olmadan girin (Orn: 1.1.0 veya 2.0.0): "

if "%new_version%"=="" (
    echo.
    echo HATA: Versiyon numarasi bos birakilamaz!
    pause
    exit /b
)

echo.
echo [1/3] Backend versiyonu (package.json) guncelleniyor...
cd backend
call npm version %new_version% --no-git-tag-version --allow-same-version
cd ..

echo.
echo [2/3] Frontend versiyonu (package.json) guncelleniyor...
cd frontend
call npm version %new_version% --no-git-tag-version --allow-same-version
cd ..

echo.
echo [3/3] Arayuz (UI) uzerindeki Layout yazi versiyonu guncelleniyor...
powershell -Command "(Get-Content frontend\src\layouts\Layout.jsx) -replace 'V[0-9]+(\.[0-9]+)*', 'V%new_version%' | Set-Content frontend\src\layouts\Layout.jsx"

echo.
echo ===================================================
echo Islem Tamamlandi! Yeni versiyon: V%new_version%
echo ===================================================
echo Dilerseniz degisiklikleri gormek icin baslat.bat dosyasini calistirabilirsiniz.
pause
