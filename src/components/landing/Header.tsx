import Link from 'next/link';

export default function Header() {
    return (
        <nav className="relative z-20 flex items-center justify-between px-6 py-5">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#10b77f] to-emerald-900 flex items-center justify-center text-white shadow-lg shadow-[#10b77f]/20">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>graphic_eq</span>
                </div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">VoiceRealty AI</h1>
            </Link>
            <div className="flex gap-4">
                <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-[#10b77f] transition-colors">
                    Inloggen
                </Link>
            </div>
        </nav>
    );
}
