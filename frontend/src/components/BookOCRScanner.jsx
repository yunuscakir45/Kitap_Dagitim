import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { X, Upload, Camera, Type, Eye, EyeOff } from 'lucide-react';

const BookOCRScanner = ({ onScanComplete, onClose }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressText, setProgressText] = useState('');
    const [error, setError] = useState('');
    const [rawText, setRawText] = useState('');
    const [showRawText, setShowRawText] = useState(false);
    const [candidates, setCandidates] = useState([]);
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
            setCandidates([]);
        };
        reader.readAsDataURL(file);
    };

    const preprocessImage = (imageDataUrl) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = canvasRef.current || document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Kitap isimleri büyük olduğu için 3000px yerine 1200px yeterli (HIZ İÇİN)
                const targetSize = 1200;
                const scale = Math.max(1, targetSize / Math.max(img.width, img.height));
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                
                ctx.imageSmoothingEnabled = true;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                const width = canvas.width;
                const height = canvas.height;

                // Hizli Grayscale ve Kontrast (Tek döngüde)
                const contrast = 40;
                const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
                
                for (let i = 0; i < data.length; i += 4) {
                    // Grayscale
                    const avg = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
                    // Contrast
                    const val = factor * (avg - 128) + 128;
                    data[i] = data[i+1] = data[i+2] = Math.min(255, Math.max(0, val));
                }

                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL('image/png', 0.8)); // 0.8 kalite hizi artirir
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
            setCandidates([]);
            setProgress(5);
            setProgressText('Görüntü ön-işleniyor...');

            const processedImage = await preprocessImage(imageSrc);

            setProgress(10);
            setProgressText('Kitap ismi okunuyor...');

            const result = await Tesseract.recognize(
                processedImage,
                'tur+eng',
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            setProgress(10 + Math.floor(m.progress * 85));
                        }
                    }
                }
            );

            const text = result.data.text;
            setRawText(text);

            // Analysis based on lines to filter noise and stylized text errors
            const rawLines = result.data.lines || [];
            const processedLines = rawLines
                .map(line => {
                    const lineText = line.text.trim();
                    // Basic noise cleaning
                    const cleaned = lineText
                        .replace(/[|\\/_~={}[\]<>]/g, '') // Remove common OCR noise symbols
                        .replace(/\s+/g, ' ')
                        .trim();
                    
                    // Score the line based on confidence and "word-likeness"
                    const confidence = line.confidence || 0;
                    const height = line.bbox.y1 - line.bbox.y0;
                    
                    // A line is likely a title if it:
                    // 1. Has reasonable confidence
                    // 2. Is not too short/long
                    // 3. Contains letters (not just symbols/numbers)
                    const hasLetters = /[a-zA-ZçğıiöşüÇĞIİÖŞÜ]/.test(cleaned);
                    const letterCount = (cleaned.match(/[a-zA-ZçğıiöşüÇĞIİÖŞÜ]/g) || []).length;
                    const symbolCount = (cleaned.match(/[^a-zA-Z0-9\s]/g) || []).length;
                    
                    return {
                        text: cleaned.toLocaleUpperCase('tr-TR'),
                        confidence,
                        height,
                        isLikely: hasLetters && letterCount > symbolCount && cleaned.length > 2 && cleaned.length < 100
                    };
                })
                .filter(line => line.isLikely && line.confidence > 20) // Filter out pure garbage
                .sort((a, b) => {
                    // Sort primarily by height (titles are big), secondarily by confidence
                    const heightDiff = b.height - a.height;
                    if (Math.abs(heightDiff) > 10) return heightDiff;
                    return b.confidence - a.confidence;
                });

            // Extract unique candidates
            const uniqueTexts = Array.from(new Set(processedLines.map(l => l.text)));
            
            if (uniqueTexts.length === 0) {
                setError('Resimden anlamlı bir kitap ismi okunamadı. Lütfen ışığı ayarlayıp daha yakından çekmeyi deneyin.');
            } else {
                setCandidates(uniqueTexts.slice(0, 10)); // Top 10 candidates
                setProgress(100);
            }

        } catch (err) {
            console.error('OCR Error:', err);
            setError('OCR işlemi başarısız oldu.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-slate-800 dark:text-slate-100">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Camera size={20} className="text-indigo-500" /> Kitap Kapağı Tara (OCR)
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}

                    <div className="flex flex-col gap-4">
                        <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center overflow-hidden relative">
                            {imageSrc ? (
                                <img src={imageSrc} alt="Preview" className="object-contain w-full h-full" />
                            ) : (
                                <div className="text-center p-6 flex flex-col items-center gap-2" onClick={() => fileInputRef.current.click()}>
                                    <Upload size={32} className="text-slate-400" />
                                    <p className="text-sm">Kitap kapağının fotoğrafını çekin veya seçin</p>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                                </div>
                            )}
                        </div>

                        {imageSrc && !isProcessing && candidates.length === 0 && (
                            <button onClick={processImage} className="btn-primary w-full py-3">
                                İsmi Tara (OCR)
                            </button>
                        )}

                        {isProcessing && (
                            <div className="space-y-2">
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                    <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                                </div>
                                <p className="text-center text-xs text-slate-500">{progressText || 'İşleniyor...'}</p>
                            </div>
                        )}

                        {candidates.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-sm font-semibold flex items-center gap-2 uppercase">
                                    <Type size={16} className="text-indigo-500" /> Okunan İsimler
                                </p>
                                <div className="grid gap-2">
                                    {candidates.map((text, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => onScanComplete(text)}
                                            className="text-left p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all text-sm font-medium"
                                        >
                                            {text}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500">Kitap ismini seçerek formu doldurabilirsiniz.</p>
                            </div>
                        )}
                    </div>

                    {rawText && (
                        <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4">
                            <button onClick={() => setShowRawText(!showRawText)} className="flex items-center gap-2 text-xs text-slate-500">
                                {showRawText ? <EyeOff size={14} /> : <Eye size={14} />} Ham Metni {showRawText ? 'Gizle' : 'Göster'}
                            </button>
                            {showRawText && <pre className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs overflow-auto max-h-32">{rawText}</pre>}
                        </div>
                    )}
                </div>
                
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                    <button onClick={onClose} className="btn-secondary py-2 px-6">İptal</button>
                </div>
            </div>
        </div>
    );
};

export default BookOCRScanner;
