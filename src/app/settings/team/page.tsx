import { getTeamMembers } from './actions';
import TeamPageClient from './TeamPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Teambeheer | Settings | VoiceRealty AI',
    description: 'Beheer uw teamleden en rollen voor VoiceRealty AI.'
};

export default async function TeamPage() {
    const { members, error } = await getTeamMembers();

    return <TeamPageClient initialMembers={members || []} error={error} />;
}
