import { getPaymentSettings } from './actions'
import PaymentSettingsForm from './PaymentSettingsForm'

export const dynamic = 'force-dynamic'

export default async function PaymentSettingsPage() {
    const data = await getPaymentSettings()

    return (
        <div className="py-8">
            <PaymentSettingsForm initialData={data} />
        </div>
    )
}
