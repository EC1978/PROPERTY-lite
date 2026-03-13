'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info, BellRing } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning' | 'notification';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message: string;
    duration?: number;
}

interface ToastContextType {
    showToast: (toast: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback(({ type, title, message, duration = 5000 }: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, type, title, message, duration }]);
        
        if (duration !== Infinity) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
                {toasts.map(toast => (
                    <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onRemove }: { toast: Toast, onRemove: (id: string) => void }) {
    const getIcon = () => {
        switch (toast.type) {
            case 'success': return <CheckCircle2 className="size-5 text-[#0df2a2]" />;
            case 'error': return <AlertCircle className="size-5 text-rose-500" />;
            case 'warning': return <AlertCircle className="size-5 text-amber-500" />;
            case 'notification': return <BellRing className="size-5 text-blue-400" />;
            default: return <Info className="size-5 text-zinc-400" />;
        }
    };

    const getBgColor = () => {
        switch (toast.type) {
            case 'success': return 'bg-[#0df2a2]/10 border-[#0df2a2]/20';
            case 'error': return 'bg-rose-500/10 border-rose-500/20';
            case 'warning': return 'bg-amber-500/10 border-amber-500/20';
            case 'notification': return 'bg-blue-500/10 border-blue-500/20';
            default: return 'bg-white/10 border-white/10';
        }
    };

    return (
        <div className={`pointer-events-auto flex items-start gap-4 p-4 rounded-[1.5rem] border backdrop-blur-xl shadow-2xl animate-in slide-in-from-right-8 duration-300 ${getBgColor()}`}>
            <div className="mt-0.5">{getIcon()}</div>
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white mb-0.5">{toast.title}</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">{toast.message}</p>
            </div>
            <button 
                onClick={() => onRemove(toast.id)}
                className="size-6 rounded-full flex items-center justify-center bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10 transition-all shrink-0"
            >
                <X className="size-3.5" />
            </button>
        </div>
    );
}

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};
