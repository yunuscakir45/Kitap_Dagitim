import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { X, Upload, Camera, FileText, Eye, EyeOff } from 'lucide-react';

const OCRScanner = ({ onScanComplete, onClose }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressText, setProgressText] = useState('');
    const [error, setError] = useState('');
    const [rawText, setRawText] = useState('');
    const [showRawText, setShowRawText] = useState(false);
    const fileInputRef = useRef(null);
    const canvasRef = useRef(null);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setImageSrc(reader.result);
            setRawText('');
            setError('');
        };
        reader.readAsDataURL(file);
    };

    /**
     * Preprocess the image using Canvas API for better OCR results.
     * Steps: upscale -> grayscale -> sharpen -> contrast -> Otsu binarization
     */
    const preprocessImage = (imageDataUrl) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = canvasRef.current || document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Step 0: Upscale for better OCR (target ~3000px on longest side)
                const scale = Math.max(1, Math.min(4, 3000 / Math.max(img.width, img.height)));
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;

                // Use high quality interpolation
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                const width = canvas.width;
                const height = canvas.height;

                // Step 1: Convert to grayscale
                const gray = new Float32Array(width * height);
                for (let i = 0; i < gray.length; i++) {
                    const idx = i * 4;
                    gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
                }

                // Step 2: Unsharp mask (sharpen) — makes letter edges crisper
                // Create a blurred copy, then sharpen = original + amount * (original - blurred)
                const blurred = new Float32Array(gray.length);
                const kernelSize = 3;
                const halfKernel = Math.floor(kernelSize / 2);
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        let sum = 0;
                        let count = 0;
                        for (let ky = -halfKernel; ky <= halfKernel; ky++) {
                            for (let kx = -halfKernel; kx <= halfKernel; kx++) {
                                const nx = x + kx;
                                const ny = y + ky;
                                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                    sum += gray[ny * width + nx];
                                    count++;
                                }
                            }
                        }
                        blurred[y * width + x] = sum / count;
                    }
                }

                const sharpenAmount = 1.5;
                const sharpened = new Float32Array(gray.length);
                for (let i = 0; i < gray.length; i++) {
                    sharpened[i] = Math.min(255, Math.max(0, gray[i] + sharpenAmount * (gray[i] - blurred[i])));
                }

                // Step 3: Contrast enhancement
                const contrast = 60;
                const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
                for (let i = 0; i < sharpened.length; i++) {
                    sharpened[i] = Math.min(255, Math.max(0, factor * (sharpened[i] - 128) + 128));
                }

                // Step 4: Otsu binarization
                const histogram = new Array(256).fill(0);
                for (let i = 0; i < sharpened.length; i++) {
                    histogram[Math.round(sharpened[i])]++;
                }

                const totalPixels = sharpened.length;
                let sumTotal = 0;
                for (let i = 0; i < 256; i++) sumTotal += i * histogram[i];

                let sumB = 0, wB = 0, maxVariance = 0, threshold = 128;
                for (let i = 0; i < 256; i++) {
                    wB += histogram[i];
                    if (wB === 0) continue;
                    const wF = totalPixels - wB;
                    if (wF === 0) break;
                    sumB += i * histogram[i];
                    const mB = sumB / wB;
                    const mF = (sumTotal - sumB) / wF;
                    const variance = wB * wF * (mB - mF) * (mB - mF);
                    if (variance > maxVariance) {
                        maxVariance = variance;
                        threshold = i;
                    }
                }

                // Apply threshold and write back to image data
                for (let i = 0; i < sharpened.length; i++) {
                    const val = sharpened[i] > threshold ? 255 : 0;
                    const idx = i * 4;
                    data[idx] = val;
                    data[idx + 1] = val;
                    data[idx + 2] = val;
                }

                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.src = imageDataUrl;
        });
    };

    const processImage = async () => {
        if (!imageSrc) {
            setError('Lütfen önce bir resim seçin.');
            return;
        }

        try {
            setIsProcessing(true);
            setError('');
            setRawText('');
            setProgress(5);
            setProgressText('Görüntü ön-işleniyor...');

            // Pre-process the image for better OCR accuracy
            const processedImage = await preprocessImage(imageSrc);

            setProgress(10);
            setProgressText('Metin tanıma başlatılıyor...');

            // Run Tesseract with PSM 6 (single uniform block of text) — works best for tables
            const result = await Tesseract.recognize(
                processedImage,
                'tur',
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            setProgress(10 + Math.floor(m.progress * 85));
                            setProgressText('Metin okunuyor...');
                        } else if (m.status === 'loading language traineddata') {
                            setProgressText('Dil verileri yükleniyor...');
                        }
                    }
                }
            );

            const text = result.data.text;
            const words = result.data.words || [];

            console.log('=== RAW OCR TEXT ===');
            console.log(text);
            console.log('=== WORD COUNT ===', words.length);
            console.log('===================');
            setRawText(text);

            setProgress(98);
            setProgressText('Öğrenci listesi ayrıştırılıyor...');

            // Try spatial (word bounding box) parsing first — more accurate for tables
            let parsedData = parseWithSpatialAnalysis(words, result.data.lines || []);

            // Fallback to text-based parsing if spatial analysis yields fewer results
            const textParsed = parseClassList(text);
            if (textParsed.length > parsedData.length) {
                parsedData = textParsed;
            }

            if (parsedData.length === 0) {
                setError('Resimden anlamlı bir öğrenci listesi çıkarılamadı. Lütfen görüntüyü daha net çekin veya düzgün bir sınıf listesi yüklediğinizden emin olun.');
            } else {
                onScanComplete(parsedData);
            }

        } catch (err) {
            console.error('OCR Error:', err);
            setError('Metin okuma sırasında bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsProcessing(false);
            setProgress(0);
            setProgressText('');
        }
    };

    /**
     * Parse students using Tesseract word-level bounding boxes.
     * Groups words into rows by Y position, then identifies columns by X position.
     */
    const parseWithSpatialAnalysis = (words, lines) => {
        if (!lines || lines.length === 0) return [];

        const students = [];
        const ignorePatterns = [
            /sinif/i, /şube/i, /lisesi/i, /müdürlüğü/i, /öğretmen/i,
            /başkan/i, /valiliği/i, /öğrenci\s*no/i, /t\.?\s*c\.?/i,
            /ankara/i, /cinsiyeti/i, /s\.?\s*no/i, /soyad/i,
            /otomasyon/i, /teknoloji/i, /endüstri/i, /alan[ıi\)]/i,
            /müdür/i, /yrd/i, /listesi/i, /adı/i
        ];

        for (const line of lines) {
            const lineText = line.text?.trim();
            if (!lineText || lineText.length < 3) continue;

            // Skip metadata/header
            const lowerLine = lineText.toLowerCase();
            if (ignorePatterns.some(p => p.test(lowerLine))) continue;

            // Get all words in this line, sorted left-to-right by X position
            const lineWords = (line.words || [])
                .filter(w => w.text.trim().length > 0)
                .sort((a, b) => a.bbox.x0 - b.bbox.x0);

            if (lineWords.length < 3) continue; // Need at least: S.No, StudentNo, Name

            // Identify number tokens at the start
            const numberWords = [];
            let nameStartIdx = -1;

            for (let i = 0; i < lineWords.length; i++) {
                const word = lineWords[i].text.trim();
                const cleaned = word.replace(/[^0-9]/g, '');
                const letterCount = (word.match(/[a-zA-ZçğıiöşüÇĞIİÖŞÜ]/g) || []).length;
                const digitCount = (word.match(/[0-9]/g) || []).length;

                if (digitCount > 0 && digitCount >= letterCount) {
                    numberWords.push(cleaned);
                } else if (letterCount > 0) {
                    nameStartIdx = i;
                    break;
                }
            }

            if (numberWords.length === 0 || nameStartIdx === -1) continue;
            if (numberWords.filter(n => n.length > 0).length === 0) continue;

            // Determine student number (skip first number = S.No)
            const validNumbers = numberWords.filter(n => n.length > 0);
            let studentNo = "";
            if (validNumbers.length === 1) {
                studentNo = validNumbers[0];
            } else if (validNumbers.length === 2) {
                studentNo = validNumbers[1];
            } else {
                studentNo = validNumbers.slice(1).join('');
            }

            const parsedNo = parseInt(studentNo);
            if (isNaN(parsedNo) || parsedNo <= 0) continue;

            // Get name words (excluding gender at end)
            let nameWords = lineWords.slice(nameStartIdx).map(w => w.text.trim());
            const genderPatterns = /^(erkek|kız|k[1i]z|erke|erek|erk|kizm|erekek)$/i;

            while (nameWords.length > 0 && (genderPatterns.test(nameWords[nameWords.length - 1]) || nameWords[nameWords.length - 1].length <= 1)) {
                nameWords.pop();
            }

            // Filter noise words (must contain at least one letter)
            nameWords = nameWords
                .filter(t => /[a-zA-ZçğıiöşüÇĞIİÖŞÜ]/.test(t))
                .map(t => t.replace(/^[^a-zA-ZçğıiöşüÇĞIİÖŞÜ]+|[^a-zA-ZçğıiöşüÇĞIİÖŞÜ]+$/g, ''));

            const fullName = nameWords.join(' ').trim().toLocaleUpperCase('tr-TR');

            if (fullName.length >= 2) {
                students.push({
                    studentNumber: parsedNo.toString(),
                    fullName: fullName
                });
            }
        }

        return Array.from(new Map(students.map(s => [s.studentNumber, s])).values());
    };

    // Fallback text-based parser
    const parseClassList = (text) => {
        const lines = text.split('\n');
        const students = [];

        const ignorePatterns = [
            /sinif/i, /şube/i, /lisesi/i, /müdürlüğü/i, /öğretmen/i,
            /başkan/i, /valiliği/i, /öğrenci\s*no/i, /t\.?\s*c\.?/i,
            /ankara/i, /cinsiyeti/i, /s\.?\s*no/i, /soyad/i,
            /otomasyon/i, /teknoloji/i, /endüstri/i, /alan[ıi\)]/i,
            /müdür/i, /yrd/i, /listesi/i, /adı/i
        ];

        lines.forEach(line => {
            const cleanLine = line.trim();
            if (!cleanLine || cleanLine.length < 4) return;

            const lowerLine = cleanLine.toLowerCase();
            if (ignorePatterns.some(p => p.test(lowerLine))) return;

            let sanitizedLine = cleanLine.replace(/^[^a-zA-ZçğıiöşüÇĞIİÖŞÜ0-9]+/, '');
            if (!sanitizedLine) return;

            const tokens = sanitizedLine.split(/\s+/).filter(t => t.length > 0);
            if (tokens.length < 2) return;

            // Find where the name starts
            let firstWordIndex = -1;
            for (let i = 0; i < tokens.length; i++) {
                const cleaned = tokens[i].replace(/[^a-zA-ZçğıiöşüÇĞIİÖŞÜ0-9]/g, '');
                const letterCount = (cleaned.match(/[a-zA-ZçğıiöşüÇĞIİÖŞÜ]/g) || []).length;
                const digitCount = (cleaned.match(/[0-9]/g) || []).length;
                if (letterCount > 0 && letterCount > digitCount) {
                    firstWordIndex = i;
                    break;
                }
            }

            if (firstWordIndex === -1 || firstWordIndex === 0) return;

            const numberTokens = tokens.slice(0, firstWordIndex)
                .map(t => t.replace(/[^0-9]/g, ''))
                .filter(t => t.length > 0);

            if (numberTokens.length === 0) return;

            let studentNo = "";
            if (numberTokens.length === 1) {
                studentNo = numberTokens[0];
            } else if (numberTokens.length === 2) {
                studentNo = numberTokens[1];
            } else {
                studentNo = numberTokens.slice(1).join('');
            }

            const parsedNo = parseInt(studentNo);
            if (isNaN(parsedNo) || parsedNo <= 0) return;

            let wordTokens = tokens.slice(firstWordIndex);
            const genderPatterns = /^(erkek|kız|k[1i]z|erke|erek|erk|kizm|erekek)$/i;
            while (wordTokens.length > 0 && (genderPatterns.test(wordTokens[wordTokens.length - 1]) || wordTokens[wordTokens.length - 1].length === 1)) {
                wordTokens.pop();
            }

            wordTokens = wordTokens
                .filter(t => /[a-zA-ZçğıiöşüÇĞIİÖŞÜ]/.test(t))
                .map(t => t.replace(/^[^a-zA-ZçğıiöşüÇĞIİÖŞÜ]+|[^a-zA-ZçğıiöşüÇĞIİÖŞÜ]+$/g, ''));

            const fullName = wordTokens.join(' ').trim().toLocaleUpperCase('tr-TR');

            if (fullName.length >= 2) {
                students.push({
                    studentNumber: parsedNo.toString(),
                    fullName: fullName
                });
            }
        });

        return Array.from(new Map(students.map(s => [s.studentNumber, s])).values());
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="bg-card rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col border border-border glass-panel">
                
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-border bg-muted/50">
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                        <FileText size={20} className="text-primary" /> Sınıf Listesi Tarama (OCR)
                    </h3>
                    <button 
                        onClick={onClose}
                        disabled={isProcessing}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {error && (
                        <div className="bg-red-500/10 text-red-500 p-4 rounded-lg text-sm text-center mb-4 border border-red-500/20">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row gap-6">
                        
                        {/* Image Preview / Upload Area */}
                        <div className="flex-1 flex flex-col gap-4">
                            <div className="aspect-[3/4] bg-muted rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center overflow-hidden relative">
                                {imageSrc ? (
                                    <>
                                        <img src={imageSrc} alt="Sınıf Listesi" className="object-contain w-full h-full opacity-80" />
                                        <button 
                                            onClick={() => { setImageSrc(null); setRawText(''); }}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition"
                                            disabled={isProcessing}
                                        >
                                            <X size={16} />
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-center p-6 flex flex-col items-center gap-3">
                                        <Upload size={40} className="text-muted-foreground" />
                                        <div>
                                            <p className="font-medium text-foreground">Resim Seçin</p>
                                            <p className="text-sm text-muted-foreground mt-1">Sınıf listesinin fotoğrafını yükleyin (Net olmasına dikkat edin)</p>
                                        </div>
                                        <button 
                                            onClick={() => fileInputRef.current.click()}
                                            className="mt-2 btn-secondary text-sm"
                                        >
                                            Dosya Seç
                                        </button>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={handleFileUpload} 
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions Area */}
                        <div className="w-full md:w-64 flex flex-col justify-center gap-4">
                            <div className="bg-primary/5 p-4 rounded-xl text-sm text-muted-foreground border border-primary/10 mb-4">
                                <p className="font-semibold mb-1 text-primary">İpuçları:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>Belge aydınlık ortamda çekilmeli.</li>
                                    <li>Sıra No, Öğrenci No, Ad ve Soyad sütunları belirgin olmalı.</li>
                                    <li>Ekran görüntüsü (PDF'den) daha iyi sonuç verir.</li>
                                </ul>
                            </div>

                            {isProcessing ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm font-medium text-primary">
                                        <span>{progressText || 'İşleniyor...'}</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2.5">
                                        <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={processImage}
                                    disabled={!imageSrc}
                                    className={`py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all
                                        ${imageSrc ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
                                >
                                    <Camera size={18} /> Metni Çıkar (OCR)
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Raw OCR Text Debug Area */}
                    {rawText && (
                        <div className="mt-4">
                            <button
                                onClick={() => setShowRawText(!showRawText)}
                                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showRawText ? <EyeOff size={14} /> : <Eye size={14} />}
                                {showRawText ? 'Ham Metni Gizle' : 'Ham OCR Metnini Göster (Hata Ayıklama)'}
                            </button>
                            {showRawText && (
                                <pre className="mt-2 p-3 bg-muted rounded-lg text-xs text-muted-foreground max-h-40 overflow-auto whitespace-pre-wrap font-mono">
                                    {rawText}
                                </pre>
                            )}
                        </div>
                    )}
                </div>

                {/* Hidden canvas for image preprocessing */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Footer */}
                <div className="p-4 border-t border-border bg-muted/50 flex justify-end">
                    <button 
                        onClick={onClose}
                        disabled={isProcessing}
                        className="btn-secondary px-6"
                    >
                        İptal 
                    </button>
                </div>

            </div>
        </div>
    );
};

export default OCRScanner;
