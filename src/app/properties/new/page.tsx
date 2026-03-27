
import { createClient } from '@/utils/supabase/server'
export const maxDuration = 60
import { redirect } from 'next/navigation'
import { checkPropertyLimit } from '@/utils/saas'
import UploadWizard from '@/components/UploadWizard'
import UpgradeModal from '@/components/UpgradeModal'

export default async function NewPropertyPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { allowed, limit, plan } = await checkPropertyLimit(supabase, user.id)
    const planName = plan as string || 'Essential'

    if (!allowed) {
        return <UpgradeModal planName={planName} limit={limit} />
    }

    return <UploadWizard />
}
