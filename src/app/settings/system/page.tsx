import { getSystemSettings } from './actions'
import MaintenanceForm from './MaintenanceForm'

export const dynamic = 'force-dynamic'

export default async function SystemSettingsPage() {
    const data = await getSystemSettings() as any

    return (
        <MaintenanceForm
            initialMaintenanceMode={data?.maintenance_mode ?? false}
            initialStatusMessage={data?.live_status_message ?? ''}
        />
    )
}
