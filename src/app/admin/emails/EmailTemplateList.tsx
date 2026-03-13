'use client';

import { useState } from 'react';
import { Mail, Edit, Eye, Bell, Send, Power, FlaskConical } from 'lucide-react';
import Link from 'next/link';
import TestTemplateModal from './TestTemplateModal';

interface Template {
    id: string;
    name: string;
    subject: string;
    type: string;
    is_active: boolean;
    description: string | null;
}

interface EmailTemplateListProps {
    templates: Template[];
}

export default function EmailTemplateList({ templates }: EmailTemplateListProps) {
    const [testTemplate, setTestTemplate] = useState<Template | null>(null);

    const emailTemplates = templates?.filter(t => t.type === 'email' || t.type === 'both') || [];
    const notificationTemplates = templates?.filter(t => t.type === 'notification' || t.type === 'both') || [];

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'email': return 'E-mail';
            case 'notification': return 'Notificatie';
            case 'both': return 'Beide';
            default: return type;
        }
    };

    const getTypeBadgeClass = (type: string) => {
        switch (type) {
            case 'email': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'notification': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'both': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            default: return 'bg-white/5 text-zinc-400 border-white/10';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'email': return <Mail className="size-5" />;
            case 'notification': return <Bell className="size-5" />;
            case 'both': return <Send className="size-5" />;
            default: return <Mail className="size-5" />;
        }
    };

    const TemplateCard = ({ template }: { template: Template }) => (
        <div className={`bg-[#111] border rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between group hover:border-[#0df2a2]/20 transition-all gap-4 ${template.is_active ? 'border-white/5' : 'border-white/5 opacity-60'}`}>
            <div className="flex items-center gap-5">
                <div className={`size-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    template.type === 'notification' ? 'bg-amber-500/10 text-amber-400' : 
                    template.type === 'both' ? 'bg-purple-500/10 text-purple-400' : 
                    'bg-[#0df2a2]/10 text-[#0df2a2]'
                }`}>
                    {getTypeIcon(template.type)}
                </div>
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-white">{template.name}</h3>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${getTypeBadgeClass(template.type)}`}>
                            {getTypeLabel(template.type)}
                        </span>
                        {!template.is_active && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border bg-red-500/10 text-red-400 border-red-500/20">
                                Inactief
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-zinc-500">Onderwerp: <span className="text-zinc-300">{template.subject}</span></p>
                    {template.description && (
                        <p className="text-xs text-zinc-600 mt-1 max-w-lg">{template.description}</p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
                <button
                    onClick={() => setTestTemplate(template)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border border-orange-500/20 transition-all font-bold text-sm shadow-lg shadow-orange-500/5 group"
                    title="Test template met een echte mail"
                >
                    <FlaskConical className="size-4 group-hover:rotate-12 transition-transform" />
                    Test
                </button>
                <Link 
                    href={`/admin/emails/${template.id}`}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all font-semibold text-sm"
                >
                    <Eye className="size-4" />
                    Preview
                </Link>
                <Link 
                    href={`/admin/emails/${template.id}`}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0df2a2] text-black hover:bg-[#0bc98a] transition-all font-bold text-sm shadow-lg shadow-[#0df2a2]/10"
                >
                    <Edit className="size-4" />
                    Wijzigen
                </Link>
            </div>
        </div>
    );

    return (
        <>
            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#111] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Mail className="size-5" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">E-mail Templates</p>
                        <p className="text-2xl font-bold text-white">{emailTemplates.length}</p>
                    </div>
                </div>
                <div className="bg-[#111] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                        <Bell className="size-5" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Notificatie Templates</p>
                        <p className="text-2xl font-bold text-white">{notificationTemplates.length}</p>
                    </div>
                </div>
                <div className="bg-[#111] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <Power className="size-5" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Actief</p>
                        <p className="text-2xl font-bold text-white">{templates?.filter(t => t.is_active).length || 0} / {templates?.length || 0}</p>
                    </div>
                </div>
            </div>

            {/* E-mail Templates Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Mail className="size-4" />
                    </div>
                    <h2 className="text-xl font-bold text-white">E-mail Templates</h2>
                    <span className="text-xs text-zinc-500 bg-white/5 px-2.5 py-1 rounded-full font-bold">{emailTemplates.length}</span>
                </div>
                <div className="grid gap-4">
                    {emailTemplates.map((template) => (
                        <TemplateCard key={template.id} template={template} />
                    ))}
                </div>
            </div>

            {/* Notification Templates Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                        <Bell className="size-4" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Notificatie Templates</h2>
                    <span className="text-xs text-zinc-500 bg-white/5 px-2.5 py-1 rounded-full font-bold">{notificationTemplates.length}</span>
                </div>
                <div className="grid gap-4">
                    {notificationTemplates.map((template) => (
                        <TemplateCard key={`notif-${template.id}`} template={template} />
                    ))}
                </div>
            </div>

            {testTemplate && (
                <TestTemplateModal 
                    template={testTemplate} 
                    onClose={() => setTestTemplate(null)} 
                />
            )}
        </>
    );
}
