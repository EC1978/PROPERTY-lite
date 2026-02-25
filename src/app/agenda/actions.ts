"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type AppointmentStatus = "gepland" | "voltooid" | "geannuleerd";

export interface Appointment {
    id: string;
    user_id: string;
    client_name: string;
    client_email: string;
    property_address: string;
    appointment_date: string;
    status: AppointmentStatus;
    created_at: string;
    updated_at: string;
}

export type CreateAppointmentInput = Omit<
    Appointment,
    "id" | "user_id" | "created_at" | "updated_at"
>;

export async function getAppointments(): Promise<{
    data: Appointment[] | null;
    error: string | null;
}> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return { data: null, error: "Unauthorized" };
        }

        const { data, error } = await supabase
            .from("appointments")
            .select("*")
            .order("appointment_date", { ascending: true });

        if (error) {
            console.error("Error fetching appointments:", error);
            return { data: null, error: error.message };
        }

        return { data, error: null };
    } catch (err: any) {
        console.error("Unknown error in getAppointments:", err);
        return { data: null, error: "An unexpected error occurred." };
    }
}

export async function createAppointment(
    input: CreateAppointmentInput
): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return { success: false, error: "Unauthorized" };
        }

        const { error } = await supabase.from("appointments").insert({
            user_id: user.id,
            client_name: input.client_name,
            client_email: input.client_email,
            property_address: input.property_address,
            appointment_date: input.appointment_date,
            status: input.status,
        });

        if (error) {
            console.error("Error creating appointment:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/agenda");
        return { success: true, error: null };
    } catch (err: any) {
        console.error("Unknown error in createAppointment:", err);
        return { success: false, error: "An unexpected error occurred." };
    }
}

export async function updateAppointmentStatus(
    id: string,
    status: AppointmentStatus
): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return { success: false, error: "Unauthorized" };
        }

        const { error } = await supabase
            .from("appointments")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("id", id)
            .eq("user_id", user.id);

        if (error) {
            console.error("Error updating appointment status:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/agenda");
        return { success: true, error: null };
    } catch (err: any) {
        console.error("Unknown error in updateAppointmentStatus:", err);
        return { success: false, error: "An unexpected error occurred." };
    }
}

export async function deleteAppointment(
    id: string
): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return { success: false, error: "Unauthorized" };
        }

        const { error } = await supabase
            .from("appointments")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);

        if (error) {
            console.error("Error deleting appointment:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/agenda");
        return { success: true, error: null };
    } catch (err: any) {
        console.error("Unknown error in deleteAppointment:", err);
        return { success: false, error: "An unexpected error occurred." };
    }
}

export async function updateAppointmentDate(
    id: string,
    newDateIso: string
): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return { success: false, error: "Unauthorized" };
        }

        const { error } = await supabase
            .from("appointments")
            .update({ appointment_date: newDateIso, updated_at: new Date().toISOString() })
            .eq("id", id)
            .eq("user_id", user.id);

        if (error) {
            console.error("Error updating appointment date:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/agenda");
        return { success: true, error: null };
    } catch (err: any) {
        console.error("Unknown error in updateAppointmentDate:", err);
        return { success: false, error: "An unexpected error occurred." };
    }
}

export async function updateAppointmentDetails(
    id: string,
    input: Partial<CreateAppointmentInput>
): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return { success: false, error: "Unauthorized" };
        }

        const { error } = await supabase
            .from("appointments")
            .update({
                client_name: input.client_name,
                client_email: input.client_email,
                property_address: input.property_address,
                appointment_date: input.appointment_date,
                status: input.status,
                updated_at: new Date().toISOString()
            })
            .eq("id", id)
            .eq("user_id", user.id);

        if (error) {
            console.error("Error updating appointment details:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/agenda");
        return { success: true, error: null };
    } catch (err: any) {
        console.error("Unknown error in updateAppointmentDetails:", err);
        return { success: false, error: "An unexpected error occurred." };
    }
}
