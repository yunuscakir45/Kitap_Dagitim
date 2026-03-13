@echo off
setlocal enabledelayedexpansion
chcp 65001 > nul
title Github Otomatik Push Araci - Kitap Dagitim Sistemi

echo ===================================================
echo   Github Guvenli Push Araci Baslatiliyor...
echo ===================================================
echo.

:: Git y??kl?? m?? kontrol et
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [HATA] Git yüklü bilgisayarinizda bulunamadi!
    echo Lutfen Git yukleyip tekrar deneyin.
    pause
    exit /b 1
)

:: .gitignore dosyası var mı kontrol et, yoksa uyar
if not exist ".gitignore" (
    echo [UYARI] Ana dizinde .gitignore dosyasi bulunamadi!
    echo Hassas verilerin ^(node_modules, .env vb.^) yuklenmemesi icin .gitignore olusturulmasi onerilir.
    echo Olusturulmadigi takdirde tum dosyalar yuklenebilir.
    choice /C EH /M "Yine de devam etmek istiyor musunuz? (E/H)"
    if errorlevel 2 goto iptal
)

:: Git repository başlatılmamışsa başlat
if not exist ".git" (
    echo [BiLGi] Git deposu baslatiliyor...
    git init
    git branch -M main
    git remote add origin https://github.com/yunuscakir45/Kitap_Dagitim.git
)

:: Remoteyi kontrol et ve g??ncelle ^(belki farkl?? bir repo tan??ml??^)
git remote -v | findstr "yunuscakir45/Kitap_Dagitim" > nul
if %errorlevel% neq 0 (
    echo [BiLGi] Uzak depo ^(remote origin^) guncelleniyor...
    git remote remove origin 2>nul
    git remote add origin https://github.com/yunuscakir45/Kitap_Dagitim.git
)

echo.
echo [ADIM 1] Degisiklikler kontrol ediliyor...
git status -s
if %errorlevel% neq 0 (
    echo [HATA] Git status komutu basarisiz oldu.
    pause
    exit /b 1
)

echo.
echo [ADIM 2] Degisiklikler sahneye ekleniyor (git add .)...
:: G??venlik i??in baz?? yayg??n hassas dosyalar?? eklememeyi zorlayabiliriz (ekstra ??nlem)
git reset >nul 2>nul
git add .
:: Yanl????l??kla eklenmi??se diye belli dosyalar?? stageden ????kar (unstage)
if exist ".env" git reset .env >nul 2>nul
if exist "backend\.env" git reset backend\.env >nul 2>nul
if exist "frontend\.env" git reset frontend\.env >nul 2>nul

echo.
echo [ADIM 3] Commit mesaji isteniyor...
set /p commitMsg="Lutfen islem aciklamasi girin (Bos birakirsa 'Otomatik Guncelleme' olacak): "
if "!commitMsg!"=="" set commitMsg=Oto-commit: %DATE% - %TIME:~0,5% Guncellemesi

echo.
echo [ADIM 4] Commit yapiliyor...
git commit -m "!commitMsg!"

echo.
echo [ADIM 5] Github'a Push ediliyor (git push origin main)...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ===================================================
    echo   [BASARILI] Kodunuz guvenli sekilde Github'a yuklendi!
    echo   https://github.com/yunuscakir45/Kitap_Dagitim
    echo ===================================================
) else (
    echo.
    echo ===================================================
    echo   [HATA] Push islemi sirasinda bir hata olustu.
    echo   Lutfen Github erisim yetkilerinizi kontrol edin.
    echo ===================================================
)

:son
echo.
pause
exit /b 0

:iptal
echo.
echo Islem iptal edildi.
pause
exit /b 0
