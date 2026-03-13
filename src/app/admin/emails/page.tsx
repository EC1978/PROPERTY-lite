import { createClient } from '@/utils/supabase/server';
import { Mail, Info } from 'lucide-react';
import EmailTemplateList from './EmailTemplateList';

export const dynamic = 'force-dynamic';

export default async function AdminEmailsPage() {
    const supabase = await createClient();

    const { data: templates } = await supabase
        .from('email_templates')
        .select('*')
        .order('name', { ascending: true });

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Template Manager</h1>
                <p className="text-zinc-400">Beheer alle e-mail en notificatie templates die worden gebruikt binnen het platform.</p>
            </div>

            <EmailTemplateList templates={templates || []} />

            {(!templates || templates.length === 0) && (
                <div className="bg-[#111] border border-dashed border-white/10 rounded-3xl p-12 text-center">
                    <p className="text-zinc-500">Geen templates gevonden in de database.</p>
                </div>
            )}

            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-6">
                <div className="flex gap-4">
                    <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                        <Info className="size-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-emerald-500 mb-1">Tip voor Superadmin</h4>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            E-mail templates worden verstuurd via de SMTP server. Gebruik de nieuwe <strong className="text-orange-400">"Test"</strong> knop om direct een voorbeeld naar je eigen inbox te sturen. Notificatie templates verschijnen als in-app meldingen. Gebruik variabelen zoals <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded">{'{{makelaar_naam}}'}</code> voor dynamische content.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
