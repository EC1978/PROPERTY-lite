import NewOrderClient from './NewOrderClient'
import { getAdminProducts } from '../../products/actions'
import { getUsersForOrder } from '../actions'
import { AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Nieuwe Bestelling | Superadmin',
    description: 'Handmatig een nieuwe bestelling of garantie aanmaken'
}

export default async function NewOrderPage() {
    // Fetch products and users in parallel
    const [productsResult, usersResult] = await Promise.all([
        getAdminProducts(),
        getUsersForOrder()
    ])

    if (productsResult.error || usersResult.error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <div className="text-center">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Fout bij inladen</h3>
                    <p className="text-zinc-500 text-sm mt-1">{productsResult.error || usersResult.error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
            <NewOrderClient
                products={productsResult.data || []}
                users={usersResult.data || []}
            />
        </div>
    )
}
