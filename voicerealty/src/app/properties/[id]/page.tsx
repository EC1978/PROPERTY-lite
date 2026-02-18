
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PropertyDetailsClient from '@/components/PropertyDetailsClient'

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: property } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (!property) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Woning niet gevonden</h1>
                    <Link href="/dashboard" className="text-[#10b77f] hover:underline mt-4 block">Terug naar Dashboard</Link>
                </div>
            </div>
        )
    }

    return <PropertyDetailsClient property={property} />
}
