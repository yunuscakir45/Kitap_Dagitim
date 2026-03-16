import React from 'react';
import { AlertCircle, BookUser, CheckCircle2, Trash2, X } from 'lucide-react';

const DeleteStudentModal = ({ student, loading, onClose, onConfirm }) => {
    if (!student) return null;

    const hasBooks = student.currentBooks && student.currentBooks.length > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="glass-panel w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-border flex justify-between items-center bg-muted/50">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <Trash2 size={18} className="text-destructive" /> Öğrenciyi Sil
                    </h3>
                    <button 
                        onClick={onClose}
                        className="p-1 hover:bg-muted rounded-full transition-colors"
                    >
                        <X size={20} className="text-muted-foreground" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="text-muted-foreground">
                        <span className="font-bold text-foreground">{student.fullName}</span> isimli student'ı silmek istediğinize emin misiniz?
                    </p>

                    {hasBooks ? (
                        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl space-y-3">
                            <div className="flex items-start gap-3 text-amber-500">
                                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-sm">Dikkat: Öğrencinin elinde kitap var!</p>
                                    <p className="text-xs opacity-90 mt-1">
                                        Kitap: {student.currentBooks[0]?.title || student.currentBooks[0]?.labelNumber}
                                    </p>
                                </div>
                            </div>
                            
                            <p className="text-xs text-amber-600 font-medium">
                                Kitap kütüphaneye teslim edildi mi?
                            </p>

                            <div className="grid grid-cols-1 gap-2">
                                <button
                                    onClick={() => onConfirm(true)}
                                    disabled={loading}
                                    className="flex items-center justify-between gap-2 w-full p-3 text-sm font-medium bg-card border border-border rounded-lg hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:text-emerald-500 transition-all group shadow-sm"
                                >
                                    <span className="flex items-center gap-2">
                                        <CheckCircle2 size={16} className="text-emerald-500" />
                                        Evet, teslim etti.
                                    </span>
                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground group-hover:text-emerald-500/80">Kitap kütüphaneye döner</span>
                                </button>
                                
                                <button
                                    onClick={() => onConfirm(false)}
                                    disabled={loading}
                                    className="flex items-center justify-between gap-2 w-full p-3 text-sm font-medium bg-card border border-border rounded-lg hover:border-red-500/50 hover:bg-red-500/5 hover:text-red-500 transition-all group shadow-sm"
                                >
                                    <span className="flex items-center gap-2">
                                        <X size={16} className="text-red-500" />
                                        Hayır, teslim etmedi.
                                    </span>
                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground group-hover:text-red-500/80">Kitap kaybolmuş sayılır</span>
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
