import Link from 'next/link';
import React from 'react';

interface LogoProps {
    className?: string;
    showText?: boolean;
    textClassName?: string;
    iconSize?: string;
    href?: string;
    isUppercase?: boolean;
}

export default function Logo({
    className = "",
    showText = true,
    textClassName = "text-lg",
    iconSize = "size-8",
    href = "/",
    isUppercase = false
}: LogoProps) {
    return (
        <React.Fragment>
            <Link href={href} className={`flex items-center gap-2 hover:opacity-80 transition-opacity ${className}`}>
                <div className={`${iconSize} rounded-lg bg-gradient-to-br from-[#10b77f] to-emerald-900 flex items-center justify-center text-white shadow-lg shadow-[#10b77f]/20 shrink-0`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>graphic_eq</span>
                </div>
                {showText && (
                    <span className={`${textClassName} font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap`}>
                        {isUppercase ? (
                            <>VOICE<span className="text-[#10b77f]">REALTY</span></>
                        ) : (
                            <>VoiceRealty<span className="text-[#10b77f]"> AI</span></>
                        )}
                    </span>
                )}
            </Link>
        </React.Fragment>
    );
}
