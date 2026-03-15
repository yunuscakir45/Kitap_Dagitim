import React from 'react';
import { AlertCircle, BookUser, CheckCircle2, Trash2, X } from 'lucide-react';

const DeleteStudentModal = ({ student, loading, onClose, onConfirm }) => {
    if (!student) return null;

    const hasBooks = student.currentBooks && student.currentBooks.length > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="glass-panel w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Trash2 size={18} className="text-red-500" /> Öğrenciyi Sil
                    </h3>
                    <button 
                        onClick={onClose}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="text-slate-600 dark:text-slate-400">
                        <span className="font-bold text-slate-800 dark:text-slate-100">{student.fullName}</span> isimli öğrenciyi silmek istediğinize emin misiniz?
                    </p>

                    {hasBooks ? (
                        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-xl space-y-3">
                            <div className="flex items-start gap-3 text-amber-800 dark:text-amber-300">
                                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-sm">Dikkat: Öğrencinin elinde kitap var!</p>
                                    <p className="text-xs opacity-90 mt-1">
                                        Kitap: {student.currentBooks[0]?.title || student.currentBooks[0]?.labelNumber}
                                    </p>
                                </div>
                            </div>
                            
                            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                                Kitap kütüphaneye teslim edildi mi?
                            </p>

                            <div className="grid grid-cols-1 gap-2">
                                <button
                                    onClick={() => onConfirm(true)}
                                    disabled={loading}
                                    className="flex items-center justify-between gap-2 w-full p-3 text-sm font-medium bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-500/30 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all group"
                                >
                                    <span className="flex items-center gap-2">
                                        <CheckCircle2 size={16} className="text-emerald-500" />
                                        Evet, teslim etti.
                                    </span>
                                    <span className="text-[10px] uppercase tracking-wider opacity-60 group-hover:opacity-100">Kitap kütüphaneye döner</span>
                                </button>
                                
                                <button
                                    onClick={() => onConfirm(false)}
                                    disabled={loading}
                                    className="flex items-center justify-between gap-2 w-full p-3 text-sm font-medium bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-500/30 rounded-lg hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-400 transition-all group"
                                >
                                    <span className="flex items-center gap-2">
                                        <X size={16} className="text-red-500" />
                                        Hayır, teslim etmedi.
                                    </span>
                                    <span className="text-[10px] uppercase tracking-wider opacity-60 group-hover:opacity-100">Kitap kaybolmuş sayılır</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={onClose}
                                className="btn-secondary"
                                disabled={loading}
                            >
                                Vazgeç
                            </button>
                            <button
                                onClick={() => onConfirm(true)}
                                className="btn-destructive"
                                disabled={loading}
                            >
                                {loading ? 'Siliniyor...' : 'Öğrenciyi Sil'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeleteStudentModal;
