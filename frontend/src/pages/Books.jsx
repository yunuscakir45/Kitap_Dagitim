import React, { useState, useEffect } from 'react';
import { bookApi } from '../api';
import { BookPlus, Trash2, UserCheck, ScanBarcode, Image as ImageIcon, Camera, RotateCcw, AlertTriangle } from 'lucide-react';
import BarcodeScanner from '../components/BarcodeScanner';
import BookOCRScanner from '../components/BookOCRScanner';

const Books = () => {
    const [books, setBooks] = useState([]);
    
    // Form States
    const [labelNumber, setLabelNumber] = useState('');
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [isbn, setIsbn] = useState('');
    const [coverImage, setCoverImage] = useState('');
    
    // UI States
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [showBookOCR, setShowBookOCR] = useState(false);
    const [isFetchingFromGoogle, setIsFetchingFromGoogle] = useState(false);

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        try {
            setLoading(true);
            const res = await bookApi.getAll();
            setBooks(res.data);
            
            // Auto-calculate next label number if the input is currently empty
            if (!labelNumber && res.data) {
                 setLabelNumber((res.data.length + 1).toString());
            }
            
            setError('');
        } catch (err) {
            setError('Kitaplar yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddBook = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            await bookApi.create({ 
                labelNumber,
                title,
                author,
                isbn,
                coverImage
            });
            
            // Reset form
            setTitle('');
            setAuthor('');
            setIsbn('');
            setCoverImage('');
            setLabelNumber(''); // Will auto-recalculate on fetchBooks
            
            await fetchBooks();
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Kitap eklenemedi.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleReactivate = async (id) => {
        try {
            setLoading(true);
            await bookApi.reactivate(id);
            await fetchBooks();
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Kitap aktifleştirilemedi.');
        } finally {
            setLoading(false);
        }
    };

    const handleScanSuccess = async (scannedIsbn) => {
        setIsbn(scannedIsbn);
        setShowScanner(false);
        await fetchGoogleBooksData(scannedIsbn);
    };

    const handleBookOCRSuccess = (scannedTitle) => {
        setTitle(scannedTitle);
        setShowBookOCR(false);
    };

    const fetchGoogleBooksData = async (queryIsbn) => {
        if (!queryIsbn) return;
        
        try {
            setIsFetchingFromGoogle(true);
            setError('');

            // 1. Try Google Books API first
            const googleResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${queryIsbn}`);
            const googleData = await googleResponse.json();

            if (googleData.items && googleData.items.length > 0) {
                const bookInfo = googleData.items[0].volumeInfo;
                setTitle(bookInfo.title || '');
                setAuthor(bookInfo.authors ? bookInfo.authors.join(', ') : '');
                if (bookInfo.imageLinks && bookInfo.imageLinks.thumbnail) {
                    setCoverImage(bookInfo.imageLinks.thumbnail.replace('http:', 'https:'));
                } else {
                    setCoverImage('');
                }
                return; // Found on Google, done
            }

            // 2. Fallback: Try Open Library API (better for Turkish books)
            const openLibResponse = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${queryIsbn}&format=json&jscmd=data`);
            const openLibData = await openLibResponse.json();
            const openLibKey = `ISBN:${queryIsbn}`;

            if (openLibData[openLibKey]) {
                const bookInfo = openLibData[openLibKey];
                setTitle(bookInfo.title || '');
                setAuthor(bookInfo.authors ? bookInfo.authors.map(a => a.name).join(', ') : '');
                if (bookInfo.cover && bookInfo.cover.medium) {
                    setCoverImage(bookInfo.cover.medium);
                } else {
                    setCoverImage('');
                }
                return; // Found on Open Library, done
            }

            // 3. Not found on either API
            setError('Kitap veritabanlarında bulunamadı. ISBN doğru ise bilgileri manuel girebilirsiniz.');
        } catch (err) {
            console.error("Book Lookup API Error:", err);
            setError('Kitap bilgileri getirilirken ağ hatası oluştu. Bilgileri manuel girebilirsiniz.');
        } finally {
            setIsFetchingFromGoogle(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu kitabı silmek istediğinize emin misiniz?')) return;

        try {
            setLoading(true);
            await bookApi.delete(id);
            await fetchBooks();
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Kitap silinemedi. Şu anda bir öğrencide olabilir.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Kitap Yönetimi</h1>
                    <p className="text-slate-500 text-sm mt-1">Sınıf kütüphanesine kitap ekleyin veya çıkarın.</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 text-sm flex items-center shadow-sm">
                    <span className="font-semibold mr-2">Hata:</span> {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Form Kartı */}
                <div className="md:col-span-1">
                    <div className="glass-panel p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                <BookPlus size={20} className="text-indigo-500" /> Yeni Kitap
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowScanner(true)}
                                    className="flex items-center gap-1.5 text-xs font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:text-indigo-300 px-3 py-1.5 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-500/20"
                                    title="ISBN Barkodu Tara"
                                >
                                    <ScanBarcode size={14} /> Barkod
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowBookOCR(true)}
                                    className="flex items-center gap-1.5 text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 dark:text-amber-300 px-3 py-1.5 rounded-lg transition-colors border border-amber-200 dark:border-amber-500/20"
                                    title="Kitap İsminden Tara (OCR)"
                                >
                                    <Camera size={14} /> OCR
                                </button>
                            </div>
                        </div>
                        
                        {isFetchingFromGoogle && (
                            <div className="mb-4 text-sm text-indigo-600 dark:text-indigo-400 animate-pulse flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent animate-spin"></div>
                                Kitap bilgileri getiriliyor...
                            </div>
                        )}

                        <form onSubmit={handleAddBook} className="space-y-4">
                            
                            {/* Özet Kapak Fotoğrafı */}
                            {coverImage && (
                                <div className="flex justify-center mb-2">
                                    <img src={coverImage} alt="Kapak" className="h-32 object-contain rounded shadow-sm border border-slate-200 dark:border-slate-700" />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                    ISBN
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Örn: 9780140328721"
                                    value={isbn}
                                    onChange={(e) => setIsbn(e.target.value)}
                                    disabled={loading || isFetchingFromGoogle}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                    Kitap Adı
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Kitap Adı"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    disabled={loading || isFetchingFromGoogle}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                    Yazar
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Yazar Adı"
                                    value={author}
                                    onChange={(e) => setAuthor(e.target.value)}
                                    disabled={loading || isFetchingFromGoogle}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                    Kitap No / Etiket
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Örn: 1, 2, 3A (Boş bırakılırsa otomatik verilir)"
                                    value={labelNumber}
                                    onChange={(e) => setLabelNumber(e.target.value)}
                                    disabled={loading || isFetchingFromGoogle}
                                />
                            </div>
                            
                            <button
                                type="submit"
                                className="btn-primary w-full"
                                disabled={loading || isFetchingFromGoogle}
                            >
                                {loading ? 'Ekleniyor...' : 'Kitap Ekle'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Liste Kartı */}
                <div className="md:col-span-2">
                    <div className="glass-panel overflow-hidden">

                        <div className="p-4 border-b border-[color:var(--border)] bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-700 dark:text-slate-200">Kayıtlı Kitaplar</h3>
                            <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                                {books.length} Kitap
                            </span>
                        </div>

                        <div className="max-h-[600px] overflow-y-auto p-0">
                            {books.length === 0 && !loading ? (
                                <div className="p-8 text-center text-slate-500">Henüz hiç kitap yok.</div>
                            ) : (
                                <ul className="divide-y divide-[color:var(--border)]">
                                    {books.map(book => {
                                        const isLost = book.lostAt !== null;
                                        return (
                                            <li key={book.id} className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex justify-between items-center group ${isLost ? 'bg-slate-50/50 dark:bg-slate-900/20' : ''}`}>

                                                <div className="flex items-center gap-4">
                                                    {/* Kapak Görseli */}
                                                    <div className={`w-12 h-16 shrink-0 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-600 ${isLost ? 'grayscale opacity-60' : ''}`}>
                                                        {book.coverImage ? (
                                                            <img src={book.coverImage} alt={book.title || 'Kapak'} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <ImageIcon size={20} className="text-slate-400" />
                                                        )}
                                                    </div>
                                                    
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${isLost ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'}`}>
                                                                #{book.labelNumber}
                                                            </span>
                                                            <h4 className={`font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 ${isLost ? 'text-slate-500' : ''}`}>
                                                                {book.title || 'İsimsiz Kitap'}
                                                            </h4>
                                                            {isLost && (
                                                                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-1.5 py-0.5 rounded flex items-center gap-1 border border-amber-200 dark:border-amber-900/50">
                                                                    <AlertTriangle size={10} /> Kayıp
                                                                </span>
                                                            )}
                                                        </div>
                                                        
                                                        {book.author && (
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                                                {book.author}
                                                            </p>
                                                        )}

                                                        {isLost ? (
                                                            <div className="mt-1 space-y-0.5">
                                                                <p className="text-[11px] text-amber-600 dark:text-amber-500 font-medium flex items-center gap-1">
                                                                    <UserCheck size={12} /> {book.lostBy?.fullName} tarafından kaybedildi
                                                                </p>
                                                                <p className="text-[10px] text-slate-400 italic">
                                                                    {new Date(book.lostAt).toLocaleDateString('tr-TR')} tarihinde
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {book.currentHolder ? (
                                                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-1 font-medium">
                                                                        <UserCheck size={12} /> {book.currentHolder.fullName} adlı öğrencide
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-xs text-green-600 dark:text-green-500 flex items-center gap-1 mt-1 font-medium">
                                                                        Kütüphanede (Aktif)
                                                                    </p>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {isLost && (
                                                        <button
                                                            onClick={() => handleReactivate(book.id)}
                                                            className="flex items-center gap-1.5 text-xs font-semibold bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-500/10 dark:hover:bg-green-500/20 dark:text-green-400 px-3 py-1.5 rounded-lg transition-all border border-green-200 dark:border-green-500/20 shadow-sm"
                                                            title="Kitap Bulundu (Aktifleştir)"
                                                            disabled={loading}
                                                        >
                                                            <RotateCcw size={14} /> Bulundu
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(book.id)}
                                                        className="btn-destructive opacity-0 group-hover:opacity-100 transition-opacity p-2"
                                                        title="Sil"
                                                        disabled={loading}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                    </div>
                </div>

            </div>

            {/* Scanner Modal */}
            {showScanner && (
                <BarcodeScanner 
                    onScanSuccess={handleScanSuccess} 
                    onClose={() => setShowScanner(false)} 
                />
            )}

            {/* OCR Scanner Modal */}
            {showBookOCR && (
                <BookOCRScanner
                    onScanComplete={handleBookOCRSuccess}
                    onClose={() => setShowBookOCR(false)}
                />
            )}
        </div>
    );
};

export default Books;
