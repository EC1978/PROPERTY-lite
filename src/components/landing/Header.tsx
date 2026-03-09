import Logo from '@/components/Logo';
import Link from 'next/link';

export default function Header() {
    return (
        <nav className="relative z-20 flex items-center justify-between px-6 py-5">
            <Logo />
            <div className="flex gap-4">
                <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-[#10b77f] transition-colors">
                    Inloggen
                </Link>
            </div>
        </nav>
    );
}
