'use client';

import { useState } from 'react';
import { toggleEmailPreference, EmailSetting } from './actions';

export default function EmailSettingsList({ initialSettings }: { initialSettings: EmailSetting[] }) {
    const [settings, setSettings] = useState<EmailSetting[]>(initialSettings);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleToggle = async (setting: EmailSetting) => {
        setLoadingId(setting.id);
        const { success, newStatus, error } = await toggleEmailPreference(setting.id, setting.isEnabled);

        if (success && newStatus !== undefined) {
            setSettings(settings.map(s => s.id === setting.id ? { ...s, isEnabled: newStatus } : s));
        } else {
            alert(error || 'Failed to update email setting.');
        }
        setLoadingId(null);
    };

    const handlePreview = (setting: EmailSetting) => {
        // Implement a modal or simple alert to preview the email
        alert('Previewing: ' + setting.name + '\nSubject: ' + setting.subject);
    };

    return (
        <div className="space-y-4">
            {settings.length === 0 ? (
                <div className="text-center text-slate-500 dark:text-gray-400 py-10 bg-slate-50 dark:bg-[#121212] rounded-2xl border border-gray-200 dark:border-white/10">
                    Geen e-mail templates gevonden.
                </div>
            ) : (
                settings.map(setting => (
                    <div
                        key={setting.id}
                        className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-white dark:bg-[#121212] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-lg gap-4 transition-all hover:bg-slate-50 dark:hover:bg-[#1a1a1a]"
                    >
                        <div className="flex gap-4 items-center">
                            <div className="h-12 w-12 rounded-xl bg-[#0df2a2]/10 text-[#0df2a2] flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[24px]">
                                    mail
                                </span>
                            </div>
                            <div>
                                <h3 className="text-slate-900 dark:text-white font-semibold text-[16px]">{setting.name}</h3>
                                <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Onderwerp: {setting.subject}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mt-2 md:mt-0 w-full md:w-auto justify-end">
                            <button
                                onClick={() => handlePreview(setting)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2 border border-gray-200 dark:border-white/10"
                            >
                                <span className="material-symbols-outlined text-[16px]">visibility</span>
                                Preview
                            </button>

                            <button
                                onClick={() => handleToggle(setting)}
                                disabled={loadingId === setting.id}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${setting.isEnabled ? 'bg-[#0df2a2]' : 'bg-gray-600'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${setting.isEnabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
