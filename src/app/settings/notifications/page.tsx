import { Suspense } from 'react';
import { getNotificationPreferences } from './actions';
import NotificationSettingsList from './NotificationSettingsList';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Notificatievoorkeuren | Settings | VoiceRealty AI',
    description: 'Beheer uw notificatievoorkeuren voor VoiceRealty AI.'
};

export default async function NotificationSettingsPage() {
    const { preferences, error } = await getNotificationPreferences();

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white m-0 leading-tight">Notificatievoorkeuren</h1>
                <p className="text-gray-400 text-[15px] mt-2 max-w-2xl">
                    Beheer hier hoe u op de hoogte wilt blijven van belangrijke gebeurtenissen. U kunt per meldingstype kiezen voor push-meldingen en/of e-mails.
                </p>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl">
                    {error}
                </div>
            )}

            <Suspense fallback={<div className="text-white">Laden...</div>}>
                <NotificationSettingsList initialPreferences={preferences} />
            </Suspense>
        </div>
    );
}
