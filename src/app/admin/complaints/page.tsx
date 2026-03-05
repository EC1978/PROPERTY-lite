import { getAdminComplaints } from './actions'
import ComplaintsManagementClient from './ComplaintsManagementClient'
import { AlertCircle } from 'lucide-react'

export const metadata = {
    title: 'Reclamaties | Superadmin',
    description: 'Beheer alle klantreclamaties en klachten'
}

export default async function AdminComplaintsPage() {
    const result = await getAdminComplaints()

    if (result.error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <div className="text-center">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Toegang Geweigerd</h3>
                    <p className="text-zinc-500 text-sm mt-1">{result.error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto">
            <ComplaintsManagementClient initialComplaints={result.data || []} />
        </div>
    )
}
