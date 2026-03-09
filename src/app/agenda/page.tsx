import { getAppointments } from "./actions";
import AgendaClient from "./AgendaClient";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from 'next/link';

export const metadata = {
    title: "Agenda | VoiceRealty AI",
    description: "Beheer je afspraken en bezichtigingen.",
};

export default async function AgendaPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const { data: appointments, error } = await getAppointments();

    // Fetch user's properties for the address dropdown
    const { data: properties, error: propError } = await supabase
        .from("properties")
        .select("id, address, city")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (propError) {
        console.error("Error fetching properties:", propError);
    }

    console.log("AGENDA PROPERTIES DATA:", properties);

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-0">
                    <Link href="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-[#0df2a2] mb-6 transition-all group">
                        <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        Dashboard
                    </Link>
                </div>

                <AgendaClient
                    initialAppointments={appointments || []}
                    properties={properties || []}
                    serverNow={new Date().toISOString()}
                />
            </div>
        </div>
    );
}
