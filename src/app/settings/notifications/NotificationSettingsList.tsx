'use client';

import { useState } from 'react';
import { toggleNotificationPreference, NotificationPreference, NotificationType } from './actions';
import { Bell, Mail } from 'lucide-react';

interface NotificationSettingsListProps {
    initialPreferences: NotificationPreference[];
}

const TYPE_LABELS: Record<NotificationType, { title: string, description: string }> = {
    new_lead: { title: 'Nieuwe Lead', description: 'Ontvang een melding wanneer een nieuwe potentiële koper interesse toont.' },
    new_review: { title: 'Nieuwe Review', description: 'Ontvang een melding wanneer uw kantoor een nieuwe klantbeoordeling ontvangt.' },
    system_updates: { title: 'Systeemupdates', description: 'Blijf op de hoogte van nieuwe functies en belangrijk platformonderhoud.' }
};

export default function NotificationSettingsList({ initialPreferences }: NotificationSettingsListProps) {
    const [preferences, setPreferences] = useState<NotificationPreference[]>(initialPreferences);
    const [loading, setLoading] = useState<Record<string, boolean>>({});

    const handleToggle = async (type: NotificationType, channel: 'pushEnabled' | 'emailEnabled', currentStatus: boolean) => {
        const loadingKey = `${type}-${channel}`;
        setLoading(prev => ({ ...prev, [loadingKey]: true }));
        try {
            const result = await toggleNotificationPreference(type, channel, currentStatus);
            if (result.success && result.newStatus !== undefined) {
                setPreferences(prev => prev.map(p => {
                    if (p.type === type) {
                        return { ...p, [channel]: result.newStatus };
                    }
                    return p;
                }));
            }
        } catch (error) {
            console.error('Error toggling preference', error);
        } finally {
            setLoading(prev => ({ ...prev, [loadingKey]: false }));
        }
    };

    return (
        <div className="space-y-6">
            {preferences.map((pref) => (
                <div key={pref.type} className="group bg-neutral-900 border border-neutral-800 rounded-2xl p-6 transition-all duration-300 hover:border-[#0df2a2]/30 hover:shadow-[0_0_30px_rgba(13,242,162,0.05)] relative overflow-hidden">
                    {/* Background glow effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0df2a2]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1">
                            <h3 className="text-xl font-semibold text-white mb-2">{TYPE_LABELS[pref.type].title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {TYPE_LABELS[pref.type].description}
                            </p>
                        </div>

                        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6 shrink-0 bg-neutral-950/50 p-4 rounded-xl border border-white/5">
                            {/* Push Toggle */}
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-gray-300">
                                    <Bell className="w-4 h-4 text-[#0df2a2]" />
                                    <span className="text-sm font-medium">Push</span>
                                </div>
                                <button
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#0df2a2] focus:ring-offset-2 focus:ring-offset-neutral-900 disabled:opacity-50 ${pref.pushEnabled ? 'bg-[#0df2a2]' : 'bg-neutral-700'}`}
                                    onClick={() => handleToggle(pref.type, 'pushEnabled', pref.pushEnabled)}
                                    disabled={loading[`${pref.type}-pushEnabled`]}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pref.pushEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <div className="hidden sm:block w-[1px] bg-white/10" />

                            {/* Email Toggle */}
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-gray-300">
                                    <Mail className="w-4 h-4 text-[#0df2a2]" />
                                    <span className="text-sm font-medium">E-mail</span>
                                </div>
                                <button
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#0df2a2] focus:ring-offset-2 focus:ring-offset-neutral-900 disabled:opacity-50 ${pref.emailEnabled ? 'bg-[#0df2a2]' : 'bg-neutral-700'}`}
                                    onClick={() => handleToggle(pref.type, 'emailEnabled', pref.emailEnabled)}
                                    disabled={loading[`${pref.type}-emailEnabled`]}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pref.emailEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
