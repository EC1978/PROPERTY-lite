import { getSystemSettings, getLetterheadSettings } from './actions'
import MaintenanceForm from './MaintenanceForm'
import LaunchResetPanel from './LaunchResetPanel'
import LetterheadUploadPanel from './LetterheadUploadPanel'

export const dynamic = 'force-dynamic'

export default async function SystemSettingsPage() {
    const data = await getSystemSettings() as any
    const letterhead = await getLetterheadSettings()

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <MaintenanceForm
                initialMaintenanceMode={data?.maintenance_mode ?? false}
                initialStatusMessage={data?.live_status_message ?? ''}
            />

            <LetterheadUploadPanel
                initialUrl={letterhead.letterhead_url}
                initialEnabled={letterhead.letterhead_enabled}
            />

            <LaunchResetPanel />
        </div>
    )
}
