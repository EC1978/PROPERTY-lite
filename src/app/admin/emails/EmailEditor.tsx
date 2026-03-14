'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateEmailTemplate } from './actions';
import { magicEditTemplate } from './magic-actions';
import { 
    Save, ChevronLeft, Mail, Info, Eye, Bell, Send, 
    Wand2, Code, Layout, Sparkles, MessageSquare, PlusCircle 
} from 'lucide-react';
import Link from 'next/link';
import { processTemplate, STANDARD_PLACEHOLDERS } from '@/utils/template-processor';

interface EmailEditorProps {
    template: {
        id: string;
        name: string;
        subject: string;
        html_body: string;
        type?: string;
        description?: string;
        is_active?: boolean;
    };
}

export default function EmailEditor({ template }: EmailEditorProps) {
    const [mounted, setMounted] = useState(false);
    const [subject, setSubject] = useState(template.subject);
    const [htmlBody, setHtmlBody] = useState(template.html_body);
    const [description, setDescription] = useState(template.description || '');
    const [isActive, setIsActive] = useState(template.is_active ?? true);
    const [isSaving, setIsSaving] = useState(false);
    const [isMagicThinking, setIsMagicThinking] = useState(false);
    const [magicPrompt, setMagicPrompt] = useState('');
    const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        
        const result = await updateEmailTemplate(template.id, { 
            subject, 
            html_body: htmlBody,
            description,
            is_active: isActive 
        });
        
        if (result.success) {
            setMessage({ type: 'success', text: 'Template succesvol bijgewerkt!' });
            router.refresh();
        } else {
            setMessage({ type: 'error', text: result.error || 'Er is iets misgegaan.' });
        }
        setIsSaving(false);
    };

    const handleMagicEdit = async () => {
        if (!magicPrompt.trim()) return;
        
        setIsMagicThinking(true);
        setMessage(null);
        
        const result = await magicEditTemplate(template.id, htmlBody, magicPrompt);
        
        if (result.success && result.newHtml) {
            setHtmlBody(result.newHtml);
            setMagicPrompt('');
            setMessage({ type: 'success', text: 'AI heeft de template aangepast! Bekijk de preview.' });
            setActiveTab('visual');
        } else {
            setMessage({ type: 'error', text: result.error || 'AI kon de wijziging niet doorvoeren.' });
        }
        setIsMagicThinking(false);
    };

    const insertPlaceholder = (tag: string) => {
        const placeholder = `{{${tag}}}`;
        setHtmlBody(prev => prev + ' ' + placeholder);
    };

    if (!mounted) {
        return <div className="max-w-5xl mx-auto h-screen bg-[#0A0A0A]" />;
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'email': return 'E-mail';
            case 'notification': return 'Notificatie';
            default: return 'E-mail';
        }
    };

    const getTypeBadgeClass = (type: string) => {
        switch (type) {
            case 'email': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'notification': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            default: return 'bg-white/5 text-zinc-400 border-white/10';
        }
    };

    // Preview data for placeholders
    const previewData = {
        agent_name: 'Erdem',
        lead_name: 'Jan de Vries',
        office_name: 'VoiceRealty AI',
        property_address: 'Keizersgracht 123, Amsterdam',
        appointment_date: 'Vrijdag 20 Maart',
        appointment_time: '14:30 uur',
        status: 'GOEDGEKEURD',
        message: 'Uw bezichtiging is zojuist bevestigd door onze makelaar.',
        link: 'https://voicerealty.ai/app/dashboard',
        titel: 'Status Update'
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Link 
                        href="/admin/emails"
                        className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <ChevronLeft className="size-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-0.5">
                            <h1 className="text-2xl font-bold text-white">{template.name}</h1>
                            {template.type && (
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${getTypeBadgeClass(template.type)}`}>
                                    {getTypeLabel(template.type)}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-zinc-500 font-medium">Beheer hoe dit bericht wordt verzonden naar gebruikers.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="peer sr-only"
                        />
                        <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0df2a2] relative"></div>
                        <span className="text-xs font-bold text-zinc-400">{isActive ? 'Actief' : 'Gepauzeerd'}</span>
                    </label>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-[#0df2a2] text-[#0A0A0A] font-black hover:bg-[#0bc98a] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-[#0df2a2]/10 active:scale-95 text-sm uppercase tracking-tight"
                    >
                        {isSaving ? (
                            <span className="flex items-center gap-2">
                                 <div className="size-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                 OPSLAAN...
                            </span>
                        ) : (
                            <>
                                <Save className="size-4" />
                                Wijzigingen Opslaan
                            </>
                        )}
                    </button>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-2xl border ${
                    message.type === 'success' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                        : 'bg-red-500/10 border-red-500/20 text-red-500'
                } animate-in zoom-in duration-300 font-bold text-sm text-center shadow-lg`}>
                    {message.text}
                </div>
            )}

            <div className="grid lg:grid-cols-[1.2fr,1fr] gap-10">
                {/* Editor Section */}
                <div className="space-y-6">
                    <div className="bg-[#111] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                        {/* Tabs */}
                        <div className="flex bg-white/[0.02] border-b border-white/5 p-2">
                            <button 
                                onClick={() => setActiveTab('visual')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold transition-all ${activeTab === 'visual' ? 'bg-white/5 text-[#0df2a2]' : 'text-zinc-500 hover:text-white'}`}
                            >
                                <Layout className="size-4" />
                                VISUEEL & AI
                            </button>
                            <button 
                                onClick={() => setActiveTab('code')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold transition-all ${activeTab === 'code' ? 'bg-white/5 text-[#0df2a2]' : 'text-zinc-500 hover:text-white'}`}
                            >
                                <Code className="size-4" />
                                HTML CODE (EXPERT)
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* General Info */}
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 mb-2.5 ml-1">Onderwerp / Titel</label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-[#0df2a2] focus:ring-1 focus:ring-[#0df2a2] outline-none transition-all font-bold text-base"
                                        placeholder="Bijv. Welkom bij VoiceRealty!"
                                    />
                                </div>
                            </div>

                            {activeTab === 'visual' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                                    {/* AI Assistant Box */}
                                    <div className="relative group">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0df2a2]/20 to-emerald-500/20 rounded-[2rem] blur opacity-75 group-focus-within:opacity-100 transition duration-1000 group-focus-within:duration-200"></div>
                                        <div className="relative bg-[#0A0A0A] border border-white/10 rounded-[2rem] p-6 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-black uppercase tracking-widest text-[#0df2a2] flex items-center gap-2">
                                                    <Sparkles className="size-3.5" />
                                                    AI Template Assistent
                                                </h4>
                                                <div className="size-6 rounded-full bg-white/5 flex items-center justify-center">
                                                    <Wand2 className="size-3 text-zinc-500" />
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-zinc-500 font-medium">Typ hier wat je wilt veranderen (bijv. "Vertaal naar Frans" of "Maak enthousiaster")</p>
                                            <div className="relative">
                                                <textarea
                                                    value={magicPrompt}
                                                    onChange={(e) => setMagicPrompt(e.target.value)}
                                                    rows={3}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-[#0df2a2] outline-none transition-all text-sm resize-none pr-14"
                                                    placeholder="Vraag de AI om de template aan te passen..."
                                                />
                                                <button 
                                                    disabled={isMagicThinking || !magicPrompt.trim()}
                                                    onClick={handleMagicEdit}
                                                    className="absolute right-3 bottom-3 size-10 rounded-xl bg-[#0df2a2] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:grayscale"
                                                >
                                                    {isMagicThinking ? (
                                                        <div className="size-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                                    ) : (
                                                        <Sparkles className="size-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Placeholder Quick Select */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <PlusCircle className="size-3.5 text-zinc-400" />
                                            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500">Invoegen Tags</label>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {STANDARD_PLACEHOLDERS.map(tag => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => insertPlaceholder(tag)}
                                                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-zinc-300 hover:border-[#0df2a2]/40 hover:text-[#0df2a2] transition-all"
                                                >
                                                    {tag}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-[#0df2a2]/5 border border-[#0df2a2]/10 rounded-3xl p-5">
                                        <div className="flex gap-4">
                                            <Info className="size-5 text-[#0df2a2] shrink-0" />
                                            <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                                                <strong>Tip:</strong> Gebruik de AI assistent voor complexe aanpassingen. De AI behoudt je design maar schuift alleen met de teksten en placeholders.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'code' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 ml-1">HTML Structuur</label>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-bold border border-white/5">Raw Mode</span>
                                    </div>
                                    <textarea
                                        value={htmlBody}
                                        onChange={(e) => setHtmlBody(e.target.value)}
                                        rows={20}
                                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-[1.5rem] px-5 py-4 text-[#0df2a2] focus:border-[#0df2a2] outline-none transition-all font-mono text-xs leading-relaxed resize-none"
                                        placeholder="Pas hier direct de HTML aan..."
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Preview Section */}
                <div className="space-y-6">
                    <div className="bg-[#111] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl h-fit sticky top-8">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                <Eye className="size-4" />
                                Live Weergave
                            </h3>
                            <div className="flex gap-1.5">
                                <div className="size-2.5 rounded-full bg-red-500/20" />
                                <div className="size-2.5 rounded-full bg-amber-500/20" />
                                <div className="size-2.5 rounded-full bg-emerald-500/20" />
                            </div>
                        </div>
                        
                        <div className="p-[2px] bg-zinc-900 overflow-hidden">
                            <div className="bg-white min-h-[500px] max-h-[700px] overflow-auto rounded-[1.5rem] m-4 shadow-inner">
                                {/* Processed HTML for preview */}
                                <div 
                                    className="text-black scale-[0.95] origin-top"
                                    dangerouslySetInnerHTML={{ __html: processTemplate(htmlBody, previewData) }} 
                                />
                            </div>
                        </div>
                        
                        <div className="p-5 bg-[#0A0A0A] border-t border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-xl bg-white/5 flex items-center justify-center">
                                    <MessageSquare className="size-4 text-zinc-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-zinc-400 tracking-wider">PREVIEW DATA</p>
                                    <p className="text-[10px] text-zinc-600 font-medium">De preview toont fictieve gegevens om de look te testen.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

