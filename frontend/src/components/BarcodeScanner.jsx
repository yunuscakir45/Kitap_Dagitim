import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X } from 'lucide-react';

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
    const scannerRef = useRef(null);
    const [error, setError] = useState('');
    const [cameras, setCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState('');
    const [scannerInstance, setScannerInstance] = useState(null);
    const [isScannerReady, setIsScannerReady] = useState(false);
    
    // Config values
    const qrcodeRegionId = "html5qr-code-full-region";

    useEffect(() => {
        const initCameras = async () => {
            try {
                const devices = await Html5Qrcode.getCameras();
                if (devices && devices.length) {
                    setCameras(devices);
                    // Default to last camera (usually rear)
                    setSelectedCameraId(devices[devices.length - 1].id);
                } else {
                    setError('Kamera bulunamadı. Lütfen izinleri kontrol edin.');
                }
            } catch (err) {
                console.error("Camera list error:", err);
                setError('Kamera erişimine izin verilmedi veya liste alınamadı.');
            }
        };
        initCameras();
    }, []);

    const [scanStatus, setScanStatus] = useState('Başlatılıyor...');

    useEffect(() => {
        if (!selectedCameraId) return;

        let html5QrCode = new Html5Qrcode(qrcodeRegionId);
        setScannerInstance(html5QrCode);
        
        const startScanner = async () => {
            try {
                setScanStatus('Kamera hazırlanıyor...');
                await new Promise(r => setTimeout(r, 800)); 
                
                if (html5QrCode.isScanning) {
                    await html5QrCode.stop();
                }

                // Configuration with native BarcodeDetector support
                const config = {
                    fps: 20, 
                    qrbox: (viewfinderWidth, viewfinderHeight) => {
                        // Responsive qrbox: 80% of width, small height for barcodes
                        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                        const boxSize = Math.floor(minEdge * 0.8);
                        return { width: boxSize, height: Math.floor(boxSize * 0.5) };
                    },
                    aspectRatio: 1.0,
                    // Use BarcodeDetector if supported (very fast on iOS 17+)
                    experimentalFeatures: {
                        useBarCodeDetectorIfSupported: true
                    }
                };
                
                const videoConstraints = {
                    deviceId: { exact: selectedCameraId },
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                };

                await html5QrCode.start(
                    videoConstraints,
                    config,
                    (decodedText) => {
                        html5QrCode.stop().then(() => onScanSuccess(decodedText)).catch(() => onScanSuccess(decodedText));
                    },
                    () => {
                        setScanStatus('Okunuyor...');
                    }
                );
                setIsScannerReady(true);
            } catch (err) {
                console.warn("Fallback to basic logic", err);
                try {
                    await html5QrCode.start(
                        selectedCameraId,
                        { 
                            fps: 15, 
                            qrbox: { width: 250, height: 150 },
                            experimentalFeatures: { useBarCodeDetectorIfSupported: true }
                        },
                        (decodedText) => {
                            html5QrCode.stop().then(() => onScanSuccess(decodedText)).catch(() => onScanSuccess(decodedText));
                        },
                        () => { setScanStatus('Okunuyor...'); }
                    );
                    setIsScannerReady(true);
                } catch (fallbackErr) {
                    setError(`Kamera başlatılamadı: ${fallbackErr.message}`);
                }
            }
        };

        startScanner();

        return () => {
            if (html5QrCode) {
                if (html5QrCode.isScanning) {
                    html5QrCode.stop().catch(() => {});
                }
            }
        };
    }, [selectedCameraId, onScanSuccess]);

    const handleCameraChange = (e) => {
        const newId = e.target.value;
        if (scannerInstance && scannerInstance.isScanning) {
            scannerInstance.stop().then(() => {
                setSelectedCameraId(newId);
                setError('');
            }).catch(() => {
                setSelectedCameraId(newId);
                setError('');
            });
        } else {
            setSelectedCameraId(newId);
            setError('');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="bg-card rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-border glass-panel">
                
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-border bg-muted/50">
                    <h3 className="font-semibold text-lg text-foreground">
                        Barkod Tarayıcı
                    </h3>
                    <button 
                        onClick={onClose}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
                        title="Kapat"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {cameras.length > 1 && (
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1 ml-1">Kamera Seçin</label>
                            <select 
                                value={selectedCameraId}
                                onChange={handleCameraChange}
                                className="w-full p-2 text-sm rounded-lg border border-border bg-background focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                {cameras.map(camera => (
                                    <option key={camera.id} value={camera.id}>
                                        {camera.label || `Kamera ${camera.id}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {error ? (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    ) : (
                        <div className="relative rounded-xl overflow-hidden bg-black aspect-square shadow-inner border border-border/50">
                            <div id={qrcodeRegionId} className="w-full h-full" />
                            {/* Overlay UI */}
                            <div className="absolute inset-x-0 bottom-4 flex flex-col items-center gap-2 pointer-events-none">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${
                                    scanStatus === 'Okunuyor...' 
                                    ? 'bg-primary/20 text-primary border-primary/30 animate-pulse' 
                                    : 'bg-black/40 text-white/70 border-white/10'
                                }`}>
                                    {scanStatus}
                                </span>
                                <span className="bg-black/60 text-white text-[10px] sm:text-xs px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20">
                                    Odaklanamazsa kamerayı yavaşça uzaklaştırın
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border bg-muted/50">
                    <button 
                        onClick={onClose}
                        className="btn-secondary w-full"
                    >
                        İptal 
                    </button>
                </div>

            </div>
        </div>
    );
};

export default BarcodeScanner;
