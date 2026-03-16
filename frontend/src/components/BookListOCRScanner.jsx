import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { X, Upload, Camera, BookList } from 'lucide-react';

const BookListOCRScanner = ({ onScanComplete, onClose }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setImageSrc(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const processImage = async () => {
        if (!imageSrc) {
            setError('Lütfen önce bir resim seçin.');
            return;
        }

        try {
            setIsProcessing(true);
            setError('');
            setProgress(10);

            // Use Tesseract.js to process the image in Turkish language
            const result = await Tesseract.recognize(
                imageSrc,
                'tur',
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            setProgress(Math.floor(m.progress * 100));
                        }
                    }
                }
            );

            const text = result.data.text;
            const parsedData = parseBookList(text);
            
            if (parsedData.length === 0) {
                setError('Resimden anlamlı bir kitap listesi çıkarılamadı. Lütfen görüntüyü daha net çekin veya düzgün bir tablo yüklediğinizden emin olun.');
            } else {
                onScanComplete(parsedData);
            }

        } catch (err) {
            console.error('OCR Error:', err);
            setError('Metin okuma sırasında bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsProcessing(false);
        }
    };

    // e-okul format parsing logic
    const parseBookList = (text) => {
        const lines = text.split('\n');
        const books = [];

        // Simple parsing: Try to find rows that look like they belong to the e-okul table
        // Usually: [Age/Type] [Book Name] [Page Count]
        // Example: "7-12 Yaş Bizim Tarihimiz - Ailenin Gücü 64"

        lines.forEach(line => {
            const cleanLine = line.trim();
            if (!cleanLine || cleanLine.length < 5) return;

            // Pattern: Start might have age range like "7-12 Yaş" or "Kitap Türü" noise
            // End might have page counts like "64"
            
            // Remove common e-okul table noise
            let processed = cleanLine
                .replace(/^7-12 Yaş\s+/i, '')
                .replace(/^Kitap türü\s+/i, '')
                .replace(/\s+\d+$/g, '') // Remove trailing numbers (page counts)
                .trim();

            // Sadece başlık gibi duran, yeterince uzun olanları al
            if (processed.length > 3 && !processed.includes('Adet Kayıt')) {
                books.push({
                    title: processed,
                    author: '',
                    isbn: '',
                    labelNumber: ''
                });
            }
        });

        // Filter out header text or noises
        const filteredBooks = books.filter(b => {
            const lowerTitle = b.title.toLowerCase();
            return !lowerTitle.includes('kitap adı') && 
                   !lowerTitle.includes('sayfa sayısı') &&
                   !lowerTitle.includes('kayıt listelenmiştir');
        });
        
        return filteredBooks;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100">
                        <span className="text-amber-500">📚</span> Kitap Listesi Tarama (OCR)
                    </h3>
                    <button 
                        onClick={onClose}
                        disabled={isProcessing}
                        className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm text-center mb-4">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row gap-6">
                        
                        {/* Preview Area */}
                        <div className="flex-1">
                            <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center overflow-hidden relative">
                                {imageSrc ? (
                                    <>
                                        <img src={imageSrc} alt="Kitap Listesi" className="object-contain w-full h-full opacity-80" />
                                        <button 
                                            onClick={() => setImageSrc(null)}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition"
                                            disabled={isProcessing}
                                        >
                                            <X size={16} />
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-center p-6 flex flex-col items-center gap-3">
                                        <Upload size={40} className="text-slate-400" />
                                        <div>
                                            <p className="font-medium text-slate-700 dark:text-slate-300">Resim Seçin</p>
                                            <p className="text-xs text-slate-500 mt-1">e-okul veya benzeri kitap listesi görüntüsü</p>
                                        </div>
                                        <button 
                                            onClick={() => fileInputRef.current.click()}
                                            className="mt-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
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

                        {/* Actions */}
                        <div className="w-full md:w-64 flex flex-col justify-center gap-4">
                            <div className="bg-amber-50 dark:bg-amber-500/10 p-4 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                                <p className="font-semibold mb-1">İpuçları:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>Mümkünse ekran görüntüsü kullanın.</li>
                                    <li>Tablo sütunlarının hizalı olduğundan emin olun.</li>
                                    <li>Yazıların okunaklı olması sonucun doğruluğunu artırır.</li>
                                </ul>
                            </div>

                            {isProcessing ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium text-amber-700 dark:text-amber-400">
                                        <span>Okunuyor...</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                        <div className="bg-amber-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={processImage}
                                    disabled={!imageSrc}
                                    className={`py-3 px-4 rounded-xl font-medium text-white shadow-sm flex items-center justify-center gap-2 transition-all
                                        ${imageSrc ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200 dark:shadow-none' : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'}`}
                                >
                                    <Camera size={18} /> Metni Çıkar (OCR)
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                    <button 
                        onClick={onClose}
                        disabled={isProcessing}
                        className="py-2.5 px-6 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        İptal 
                    </button>
                </div>

            </div>
        </div>
    );
};

export default BookListOCRScanner;
