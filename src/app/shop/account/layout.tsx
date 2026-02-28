export default function AccountLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="animate-in fade-in duration-700">
            {children}
        </div>
    )
}
