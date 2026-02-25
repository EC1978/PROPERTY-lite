import { Suspense } from 'react';
import { getEmailSettings } from './actions';
import EmailSettingsList from './EmailSettingsList';

export default async function EmailSettingsPage() {
    const { settings, error } = await getEmailSettings();

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white m-0 leading-tight">Geautomatiseerde E-mails</h1>
                <p className="text-gray-400 text-[15px] mt-2 max-w-2xl">
                    Beheer hier de geautomatiseerde e-mails die vanuit VoiceRealty AI naar uw klanten worden verzonden. U kunt ze per stuk aan- of uitzetten.
                </p>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl">
                    {error}
                </div>
            )}

            <Suspense fallback={<div className="text-white">Laden...</div>}>
                <EmailSettingsList initialSettings={settings} />
            </Suspense>
        </div>
    );
}
