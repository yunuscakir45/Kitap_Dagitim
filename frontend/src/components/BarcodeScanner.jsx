import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X } from 'lucide-react';

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
    const scannerRef = useRef(null);
    const [error, setError] = useState('');
    const [cameraList, setCameraList] = useState([]);
    
    // Config values
    const qrcodeRegionId = "html5qr-code-full-region";

    useEffect(() => {
        let html5QrCode;
        
        const startScanner = async () => {
            try {
                // Request permissions and get cameras
                const devices = await Html5Qrcode.getCameras();
                if (devices && devices.length) {
                    setCameraList(devices);
                    
                    html5QrCode = new Html5Qrcode(qrcodeRegionId);
                    
                    // Priority to rear camera
                    const config = {
                        fps: 10,
                        qrbox: { width: 250, height: 150 },
                        aspectRatio: 1.0,
                    };
                    
                    await html5QrCode.start(
                        { facingMode: "environment" },
                        config,
                        (decodedText) => {
                            // On Success
                            // 1. Play success sound (optional, browsers block audio without interaction sometimes)
                            const audio = new Audio('/success-beep.mp3'); // Need to provide a beep file in public/ if we really want this
                            audio.play().catch(e => console.log('Audio play failed silently', e));
                            
                            // 2. Stop camera
                            html5QrCode.stop().then(() => {
                                // 3. Pass data back to parent
                                onScanSuccess(decodedText);
                            }).catch(err => {
                                console.error("Failed to stop scanner", err);
                                onScanSuccess(decodedText); // Send it anyway
                            });
                        },
                        (errorMessage) => {
                            // Ignore scan failure, it happens continuously until a barcode is found
                        }
                    );
                } else {
                    setError('Kamera bulunamadı.');
                }
            } catch (err) {
                console.error("Camera error:", err);
                setError('Kamera erişimine izin verilmedi veya bir hata oluştu. Lütfen tarayıcı izinlerini kontrol edin.');
            }
        };

        startScanner();

        // Cleanup on unmount
        return () => {
            if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().catch(err => console.error("Failed to stop scanner on unmount", err));
            }
        };
    }, [onScanSuccess]);

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
                <div className="p-4">
                    {error ? (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    ) : (
                        <div className="relative rounded-xl overflow-hidden bg-black aspect-square">
                            <div id={qrcodeRegionId} className="w-full h-full" />
                            {/* Overlay UI (handled mostly by html5-qrcode but we can add text) */}
                            <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                                <span className="bg-black/50 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-md">
                                    ISBN Barkodunu kutunun içine hizalayın
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
