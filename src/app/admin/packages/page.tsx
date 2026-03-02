import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PackageBuilderClient from './PackageBuilderClient'

export const revalidate = 0

export default async function AdminPackagesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (userData?.role !== 'superadmin') redirect('/dashboard')

    const { data: packages, error } = await supabase
        .from('packages')
        .select('*')
        .order('sort_order')

    if (error || !packages) {
        return <div className="p-8 text-red-400">Kon pakketten niet laden.</div>
    }

    return <PackageBuilderClient packages={packages} />
}
