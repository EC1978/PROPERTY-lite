import Link from 'next/link'

export default async function AuthCodeErrorPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>
}) {
    const params = await searchParams
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                <div className="size-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-red-500 text-3xl">error</span>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Authenticatie Fout</h1>
                <p className="text-slate-400 mb-6">
                    {params.error || 'Er is een probleem opgetreden bij het verwerken van je login. De link is mogelijk verlopen of ongeldig.'}
                </p>
                <div className="space-y-3">
                    <Link
                        href="/login"
                        className="block w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors"
                    >
                        Terug naar Login
                    </Link>
                    <Link
                        href="/"
                        className="block w-full text-slate-400 hover:text-white text-sm transition-colors"
                    >
                        Naar Home
                    </Link>
                </div>
            </div>
        </div>
    )
}
