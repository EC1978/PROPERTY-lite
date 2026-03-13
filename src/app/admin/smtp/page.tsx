import { getSmtpSettings } from './actions';
import SmtpForm from './SmtpForm';

export const dynamic = 'force-dynamic';

export default async function SmtpPage() {
    const initialSettings = await getSmtpSettings();

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">SMTP Server Configuratie</h1>
                <p className="text-zinc-400">
                    Beheer de globale e-mail server instellingen. Deze server wordt gebruikt voor het verzenden van alle systeem- en marketing e-mails. Zonder juiste configuratie worden er geen e-mails verwerkt.
                </p>
            </div>

            <SmtpForm initialSettings={initialSettings} />
            
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-3xl p-6 mt-8">
                <div className="flex gap-4">
                    <div className="size-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                        <span className="material-symbols-outlined">warning</span>
                    </div>
                    <div>
                        <h4 className="font-bold text-amber-500 mb-1">Let op</h4>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            Na het wijzigen van de SMTP gegevens is het raadzaam om de connectie grondig te testen. Zorg ervoor dat het opgegeven e-mailadres is geverifieerd door je SMTP provider om SPAM-markeringen te voorkomen.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
