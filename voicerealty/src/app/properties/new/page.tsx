
import { createClient } from '@/utils/supabase/server'
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

    const { allowed } = await checkPropertyLimit(supabase, user.id)

    if (!allowed) {
        return <UpgradeModal />
    }

    return <UploadWizard />
}
