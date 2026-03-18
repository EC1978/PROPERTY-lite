import { getSystemSettings } from './actions'
import MaintenanceForm from './MaintenanceForm'
import LaunchResetPanel from './LaunchResetPanel'

export const dynamic = 'force-dynamic'

export default async function SystemSettingsPage() {
    const data = await getSystemSettings() as any

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <MaintenanceForm
                initialMaintenanceMode={data?.maintenance_mode ?? false}
                initialStatusMessage={data?.live_status_message ?? ''}
            />
            
            <LaunchResetPanel />
        </div>
    )
}
