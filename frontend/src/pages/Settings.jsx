import React, { useState } from 'react';
import { adminApi } from '../api';
import { Settings as SettingsIcon, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
    const [confirmText, setConfirmText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const navigate = useNavigate();
    const EXPECTED_CONFIRM = 'YES_RESET_EVERYTHING';

    const handleReset = async (e) => {
        e.preventDefault();

        if (confirmText !== EXPECTED_CONFIRM) {
            setError('Lütfen onay metnini doğru girdiğinizden emin olun.');
            return;
        }

        if (!window.confirm('DİKKAT! Bu işlem GERİ ALINAMAZ. Tüm öğrenciler, kitaplar, geçmiş ve dağıtım kayıtları silinecek. Emin misiniz?')) {
            return;
        }

        try {
            setLoading(true);
            setError('');
            await adminApi.resetAll({ confirm: confirmText });
            setSuccess('Sistem başarıyla sıfırlandı. 3 saniye içinde Dashboard\'a yönlendirileceksiniz.');
            setConfirmText('');

            setTimeout(() => {
                navigate('/');
            }, 3000);

        } catch (err) {
            setError(err.response?.data?.error || 'Sistem sıfırlanırken hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">

            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Sistem Ayarları</h1>
                <p className="text-slate-500 text-sm mt-1">Uygulama geneli tehlikeli işlemler bölgesi.</p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-sm flex items-center shadow-sm">
                    <AlertTriangle className="mr-2" size={18} /> {error}
                </div>
            )}

            {success && (
                <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl border border-emerald-200 text-sm flex items-center shadow-sm font-medium">
                    {success}
                </div>
            )}

            <div className="glass-panel border-red-200 dark:border-red-900/30 overflow-hidden">
                <div className="p-5 border-b border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 flex items-center gap-3">
                    <div className="bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-2 rounded-lg">
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-red-700 dark:text-red-400">Tehlikeli Bölge (Danger Zone)</h3>
                        <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">Tüm veritabanı sıfırlama işlemi</p>
                    </div>
                </div>

                <div className="p-6">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                        Aşağıdaki işlem <strong className="text-slate-800 dark:text-slate-200">tüm öğrenci kayıtlarını, kitap defterlerini, aktif dağıtımları ve okuma geçmişlerini kalıcı olarak silecektir.</strong> Dönem sonları veya yepyeni bir sınıfla çalışmaya başlarken kullanılmalıdır.
                    </p>

                    <form onSubmit={handleReset} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Onaylamak için kutuya <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-red-600 select-all">{EXPECTED_CONFIRM}</span> yazınız:
                            </label>
                            <input
                                type="text"
                                className="input-field border-red-200 focus-visible:ring-red-500"
                                placeholder="Onay metnini buraya yapıştırın"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                disabled={loading || success}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-destructive w-full flex justify-center items-center gap-2"
                            disabled={loading || confirmText !== EXPECTED_CONFIRM || success}
                        >
                            <SettingsIcon size={18} />
                            {loading ? 'Sıfırlanıyor...' : 'Tüm Sistemi Kalıcı Olarak Sıfırla'}
                        </button>
                    </form>
                </div>
            </div>

        </div>
    );
};

export default Settings;
