'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Settings, Mail, Calendar, Info, ShieldAlert, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/app/actions/notifications';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Notification {
    id: string;
    category: 'system' | 'lead_update' | 'review' | 'appointment' | 'other';
    title: string;
    message: string;
    status: 'unread' | 'read' | string;
    created_at: string;
    payload: any;
}

export default function NotificationBell({ isAdminView = false }: { isAdminView?: boolean }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => n.status === 'unread').length;

    useEffect(() => {
        const fetchNotifications = async () => {
            const result = await getUserNotifications();
            if (result.success && result.data) {
                setNotifications(result.data);
            }
            setIsLoading(false);
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' } : n));
        await markNotificationAsRead(id);
    };

    const handleMarkAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
        await markAllNotificationsAsRead();
    };

    const getCategoryStyles = (category: string) => {
        switch (category) {
            case 'system': return { icon: <ShieldAlert className="size-4" />, color: 'text-rose-400', bg: 'bg-rose-500/10' };
            case 'lead_update': return { icon: <Mail className="size-4" />, color: 'text-[#0df2a2]', bg: 'bg-[#0df2a2]/10' };
            case 'appointment': return { icon: <Calendar className="size-4" />, color: 'text-blue-400', bg: 'bg-blue-500/10' };
            case 'review': return { icon: <Sparkles className="size-4" />, color: 'text-amber-400', bg: 'bg-amber-500/10' };
            default: return { icon: <Info className="size-4" />, color: 'text-zinc-400', bg: 'bg-white/5' };
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2.5 rounded-2xl transition-all duration-300 group ${
                    isAdminView 
                        ? 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10' 
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent dark:hover:border-white/10'
                }`}
                aria-label="Notificaties"
            >
                <Bell className={`size-5 transition-transform duration-300 ${isOpen ? 'scale-110' : 'group-hover:rotate-12'}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 flex size-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full size-2.5 bg-rose-500 border-2 border-[#0A0A0A]"></span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className={`absolute right-0 mt-3 w-[22rem] sm:w-[26rem] rounded-[2rem] border backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden z-50 origin-top-right animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300 ${
                    isAdminView ? 'bg-[#0A0A0A]/90 border-white/10' : 'bg-white/95 dark:bg-[#0A0A0A]/90 border-gray-100 dark:border-white/10'
                }`}>
                    <div className="px-6 py-5 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <h3 className="font-bold text-white text-lg">Notificaties</h3>
                            {unreadCount > 0 && (
                                <span className="px-2.5 py-0.5 rounded-full bg-[#0df2a2]/10 text-[#0df2a2] text-[10px] font-black uppercase tracking-wider">
                                    {unreadCount} nieuw
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button 
                                onClick={handleMarkAllRead}
                                className="text-[11px] font-bold text-[#0df2a2] hover:text-[#0bc98a] transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#0df2a2]/5"
                            >
                                <Check className="size-3.5" />
                                Alles gelezen
                            </button>
                        )}
                    </div>

                    <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center p-12 gap-3 text-zinc-500">
                                <div className="size-6 border-2 border-[#0df2a2]/20 border-t-[#0df2a2] rounded-full animate-spin" />
                                <span className="text-xs font-medium italic">Laden...</span>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <div className="size-16 rounded-full mb-4 flex items-center justify-center bg-white/5 border border-white/5">
                                    <Bell className="size-7 text-zinc-700" />
                                </div>
                                <p className="text-sm font-bold text-white">Je bent helemaal bij!</p>
                                <p className="text-xs mt-1 text-zinc-500">Er zijn op dit moment geen nieuwe meldingen.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {notifications.map((notif) => {
                                    const styles = getCategoryStyles(notif.category);
                                    return (
                                        <div 
                                            key={notif.id}
                                            className={`p-5 transition-all relative group flex gap-4 ${
                                                notif.status === 'unread' 
                                                    ? 'bg-[#0df2a2]/[0.02] hover:bg-[#0df2a2]/[0.04]'
                                                    : 'hover:bg-white/[0.02] opacity-70'
                                            }`}
                                        >
                                            <div className="shrink-0">
                                                <div className={`size-10 rounded-xl flex items-center justify-center border border-white/5 ${styles.bg} ${styles.color}`}>
                                                    {styles.icon}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <h4 className={`text-sm font-bold truncate ${notif.status === 'unread' ? 'text-white' : 'text-zinc-400'}`}>
                                                        {notif.title}
                                                    </h4>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 font-bold shrink-0 whitespace-nowrap">
                                                        <Clock className="size-2.5" />
                                                        {new Date(notif.created_at).toLocaleDateString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                                <p className={`text-xs leading-relaxed line-clamp-2 ${notif.status === 'unread' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                                                    {notif.message}
                                                </p>
                                                
                                                {notif.status === 'unread' && (
                                                    <button 
                                                        onClick={(e) => handleMarkAsRead(notif.id, e)}
                                                        className="mt-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#0df2a2] hover:text-white transition-colors"
                                                    >
                                                        Gelezen
                                                        <ArrowRight className="size-2.5" />
                                                    </button>
                                                )}
                                            </div>
                                            {notif.status === 'unread' && (
                                                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#0df2a2]"></div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    
                    <div className="p-4 bg-white/[0.02] border-t border-white/5">
                        <Link 
                            href="/admin/emails" 
                            className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all text-[11px] font-bold uppercase tracking-widest"
                        >
                            <Settings className="size-3.5" />
                            Instellingen
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
