import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X } from 'lucide-react';

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
    const scannerRef = useRef(null);
    const [error, setError] = useState('');
    const [cameras, setCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState('');
    const [scannerInstance, setScannerInstance] = useState(null);
    
    // Config values
    const qrcodeRegionId = "html5qr-code-full-region";

    useEffect(() => {
        const initCameras = async () => {
            try {
                const devices = await Html5Qrcode.getCameras();
                if (devices && devices.length) {
                    setCameras(devices);
                    // Default to last camera (usually rear on mobile)
                    setSelectedCameraId(devices[devices.length - 1].id);
                } else {
                    setError('Kamera bulunamadı.');
                }
            } catch (err) {
                console.error("Camera list error:", err);
                setError('Kamera erişimine izin verilmedi.');
            }
        };
        initCameras();
    }, []);

    useEffect(() => {
        if (!selectedCameraId) return;

        const html5QrCode = new Html5Qrcode(qrcodeRegionId);
        setScannerInstance(html5QrCode);
        
        const startScanner = async () => {
            try {
                const config = {
                    fps: 20,
                    qrbox: { width: 250, height: 150 },
                    aspectRatio: 1.0,
                };
                
                const videoConstraints = {
                    deviceId: { exact: selectedCameraId },
                    focusMode: "continuous",
                    width: { min: 640, ideal: 1280, max: 1920 },
                    height: { min: 480, ideal: 720, max: 1080 },
                };

                await html5QrCode.start(
                    videoConstraints,
                    config,
                    (decodedText) => {
                        const audio = new Audio('/success-beep.mp3');
                        audio.play().catch(() => {});
                        html5QrCode.stop().then(() => {
                            onScanSuccess(decodedText);
                        }).catch(() => {
                            onScanSuccess(decodedText);
                        });
                    },
                    () => {}
                );
            } catch (err) {
                console.error("Scanner start error:", err);
                setError('Kamera başlatılamadı. Farklı bir kamera seçmeyi deneyin.');
            }
        };

        startScanner();

        return () => {
            if (html5QrCode.isScanning) {
                html5QrCode.stop().catch(err => console.error("Cleanup error", err));
            }
        };
    }, [selectedCameraId, onScanSuccess]);

    const handleCameraChange = (e) => {
        const newId = e.target.value;
        if (scannerInstance && scannerInstance.isScanning) {
            scannerInstance.stop().then(() => {
                setSelectedCameraId(newId);
            }).catch(() => {
                setSelectedCameraId(newId);
            });
        } else {
            setSelectedCameraId(newId);
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
                            <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
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
