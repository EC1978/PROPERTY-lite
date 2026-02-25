import { getAppointments } from "./actions";
import AgendaClient from "./AgendaClient";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

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
        <div className="min-h-screen bg-[#121212] text-white p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Mijn Agenda
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Beheer al je aankomende bezichtigingen en afspraken.
                    </p>
                </div>

                <AgendaClient
                    initialAppointments={appointments || []}
                    properties={properties || []}
                />
            </div>
        </div>
    );
}
