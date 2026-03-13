import { createClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import EmailEditor from '../EmailEditor';

export default async function EditEmailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient();

    // Verify user is superadmin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'superadmin') {
        redirect('/dashboard');
    }

    const { data: template } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', params.id)
        .single();

    if (!template) {
        return notFound();
    }

    return <EmailEditor template={template} />;
}
