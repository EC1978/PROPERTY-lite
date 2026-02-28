"use client";

import { useState, useTransition, useMemo } from "react";
import {
    Appointment,
    createAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    updateAppointmentDate,
    updateAppointmentDetails,
    CreateAppointmentInput,
    AppointmentStatus,
} from "./actions";
import { Calendar, Clock, MapPin, Plus, User, Trash2, CheckCircle, XCircle, LayoutGrid, List } from "lucide-react";
import { format, addDays, startOfToday, startOfWeek, isSameDay } from "date-fns";
import { nl } from "date-fns/locale";

interface AgendaClientProps {
    initialAppointments: Appointment[];
    properties: { id: string; address: string | null; city: string | null }[];
}

// Configuration for Timeline
const START_HOUR = 8;
const END_HOUR = 20;
const HOURS_COUNT = END_HOUR - START_HOUR + 1;
const HOUR_HEIGHT = 80; // pixels per hour

export default function AgendaClient({ initialAppointments, properties }: AgendaClientProps) {
    const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");
    const [showWeekends, setShowWeekends] = useState(false);

    // Filters for List View
    const [statusFilter, setStatusFilter] = useState<"alle" | AppointmentStatus>("alle");
    const [dateRangeFilter, setDateRangeFilter] = useState<"alle" | "6m" | "3m" | "1m" | "1w" | "1y">("alle");

    // Form State
    const [clientName, setClientName] = useState("");
    const [clientEmail, setClientEmail] = useState("");
    const [propertyAddress, setPropertyAddress] = useState("");
    const [selectedPropertyId, setSelectedPropertyId] = useState<string | "custom">("");
    const [appointmentDate, setAppointmentDate] = useState("");
    const [appointmentTime, setAppointmentTime] = useState("");
    const [appointmentStatus, setAppointmentStatus] = useState<AppointmentStatus>("gepland");
    const [error, setError] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);

    const resetForm = () => {
        setClientName("");
        setClientEmail("");
        setPropertyAddress("");
        setSelectedPropertyId("");
        setAppointmentDate("");
        setAppointmentTime("");
        setAppointmentStatus("gepland");
        setEditingId(null);
        setError("");
    };

    const handleOpenModal = (app?: Appointment) => {
        if (app) {
            setClientName(app.client_name);
            setClientEmail(app.client_email);
            setAppointmentStatus(app.status);

            // Try to match existing property by address
            const matchingProp = properties.find(
                (p) =>
                    p.address?.toLowerCase() === app.property_address?.toLowerCase() ||
                    `${p.address}, ${p.city}`.toLowerCase() === app.property_address?.toLowerCase()
            );

            if (matchingProp) {
                setSelectedPropertyId(matchingProp.id);
                setPropertyAddress(""); // Not used if a property is selected
            } else {
                setSelectedPropertyId("custom");
                setPropertyAddress(app.property_address || "");
            }

            const dateObj = new Date(app.appointment_date);
            setAppointmentDate(format(dateObj, "yyyy-MM-dd"));
            setAppointmentTime(format(dateObj, "HH:mm"));

            setEditingId(app.id);
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const handleSaveAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        let finalAddress = propertyAddress;

        if (selectedPropertyId && selectedPropertyId !== "custom") {
            const prop = properties.find(p => p.id === selectedPropertyId);
            if (prop) {
                finalAddress = [prop.address, prop.city].filter(Boolean).join(", ") || prop.address || "";
            }
        }

        if (!clientName || !clientEmail || !finalAddress || !appointmentDate || !appointmentTime || !appointmentStatus) {
            setError("Vul alle velden in.");
            return;
        }

        const dateTimeString = `${appointmentDate}T${appointmentTime}:00`;
        const input: Partial<CreateAppointmentInput> = {
            client_name: clientName,
            client_email: clientEmail,
            property_address: finalAddress,
            appointment_date: new Date(dateTimeString).toISOString(),
            status: appointmentStatus,
        };

        startTransition(async () => {
            let success = false;
            let serverError: string | null = null;

            if (editingId) {
                const result = await updateAppointmentDetails(editingId, input);
                success = result.success;
                serverError = result.error;
            } else {
                const result = await createAppointment(input as CreateAppointmentInput);
                success = result.success;
                serverError = result.error;
            }

            if (success) {
                setIsModalOpen(false);
                window.location.reload();
            } else {
                setError(serverError || "Er is een fout opgetreden bij het opslaan.");
            }
        });
    };

    const handleStatusUpdate = async (id: string, newStatus: AppointmentStatus) => {
        startTransition(async () => {
            setAppointments((prev) =>
                prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
            );
            await updateAppointmentStatus(id, newStatus);
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Weet je zeker dat je deze afspraak wilt verwijderen?")) return;
        startTransition(async () => {
            setAppointments((prev) => prev.filter((app) => app.id !== id));
            await deleteAppointment(id);
        });
    };

    // --- Drag & Drop Timeline Logic ---
    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData("appointment_id", id);
        // Add a slight transparency while dragging
        requestAnimationFrame(() => {
            (e.target as HTMLElement).style.opacity = '0.5';
        });
    };

    const handleDragEnd = (e: React.DragEvent) => {
        (e.target as HTMLElement).style.opacity = '1';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, targetDate: Date) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("appointment_id");
        if (!id) return;

        const appointment = appointments.find((a) => a.id === id);
        if (!appointment) return;

        // Calculate time based on drop position relative to the timeline column
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;

        const totalHoursFromStart = Math.max(0, y / HOUR_HEIGHT);
        let hour = Math.floor(totalHoursFromStart) + START_HOUR;

        // Calculate minutes based on fractional hour
        const fractionalHour = totalHoursFromStart - Math.floor(totalHoursFromStart);
        let minutes = Math.floor(fractionalHour * 60);

        // Snap to nearest 15 minutes
        minutes = Math.round(minutes / 15) * 15;
        if (minutes === 60) {
            hour += 1;
            minutes = 0;
        }

        // Clamp values to ensure it stays within timeline bounds visuals
        if (hour < START_HOUR) { hour = START_HOUR; minutes = 0; }
        if (hour >= END_HOUR) { hour = END_HOUR; minutes = 0; }

        const newDate = new Date(targetDate);
        newDate.setHours(hour, minutes, 0, 0);
        const newDateIso = newDate.toISOString();

        // Optimistic Update
        setAppointments((prev) =>
            prev.map((app) => (app.id === id ? { ...app, appointment_date: newDateIso } : app))
        );

        // Server Update
        startTransition(async () => {
            const { success } = await updateAppointmentDate(id, newDateIso);
            if (!success) {
                window.location.reload();
            }
        });
    };

    const statusColors = {
        gepland: "bg-[#1E88E5]/30 text-[#90CAF9] border-[#1E88E5]/50", // Soft, tech-forward blue
        voltooid: "bg-[#0df2a2]/20 text-[#0df2a2] border-[#0df2a2]/40",
        geannuleerd: "bg-[#E53935]/30 text-[#ef9a9a] border-[#E53935]/50",
    };

    // Week Calculation
    const today = startOfToday();
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 })
        .map((_, i) => addDays(startOfCurrentWeek, i))
        .filter((_, idx) => showWeekends ? true : idx < 5);

    // Timeline Hours Array
    const timeSlots = Array.from({ length: HOURS_COUNT }).map((_, i) => START_HOUR + i);

    // Position Calculator
    const getPositionStyle = (dateString: string) => {
        const date = new Date(dateString);
        let hour = date.getHours();
        const minutes = date.getMinutes();

        // Clamp to timeline boundaries visually, or just stack at top/bottom if out of bounds
        // For standard real estate, appointments usually fall in this range
        if (hour < START_HOUR) hour = START_HOUR;
        if (hour > END_HOUR) { hour = END_HOUR; }

        const fractionalHour = (hour - START_HOUR) + (minutes / 60);
        const topPx = fractionalHour * HOUR_HEIGHT;
        const heightPx = HOUR_HEIGHT; // Fixed 1hr duration visual for now

        return {
            top: `${topPx}px`,
            height: `${heightPx - 4}px`, // Slight padding
        };
    };

    return (
        <div>
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <h2 className="text-xl font-semibold text-white">Mijn Week & Afspraken</h2>

                    <div className="flex items-center gap-4">
                        <div className="bg-[#1a1a1a] p-1 rounded-lg border border-gray-800 flex shadow-sm">
                            <button
                                onClick={() => setViewMode("list")}
                                className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-[#242424] text-[#0df2a2] shadow-sm" : "text-gray-500 hover:text-white"
                                    }`}
                                title="Lijstweergave"
                            >
                                <List size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode("calendar")}
                                className={`p-1.5 rounded-md transition-all ${viewMode === "calendar" ? "bg-[#242424] text-[#0df2a2] shadow-sm" : "text-gray-500 hover:text-white"
                                    }`}
                                title="Kalender Weergave"
                            >
                                <Calendar size={18} />
                            </button>
                        </div>

                        {viewMode === "calendar" && (
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-400 hover:text-white transition-colors">
                                <span className={showWeekends ? "text-[#0df2a2] font-medium" : ""}>Weekend</span>
                                <div className="relative inline-block w-10 h-5">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={showWeekends}
                                        onChange={() => setShowWeekends(!showWeekends)}
                                    />
                                    <div className="w-10 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0df2a2]"></div>
                                </div>
                            </label>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center justify-center gap-2 bg-[#0df2a2] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#0df2a2]/90 transition-all duration-300 shadow-[0_0_15px_rgba(13,242,162,0.3)] hover:shadow-[0_0_25px_rgba(13,242,162,0.5)] transform hover:-translate-y-0.5"
                >
                    <Plus size={18} />
                    <span>Nieuwe Afspraak</span>
                </button>
            </div>

            {/* Content Views */}
            {viewMode === "list" ? (
                /* ----------------- FILTERED LIST VIEW ----------------- */
                <div className="space-y-6">
                    {/* Filters Row */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="bg-[#1a1a1a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#0df2a2]"
                        >
                            <option value="alle">Status: Alle</option>
                            <option value="gepland">Gepland</option>
                            <option value="voltooid">Voltooid</option>
                            <option value="geannuleerd">Geannuleerd</option>
                        </select>
                        <select
                            value={dateRangeFilter}
                            onChange={(e) => setDateRangeFilter(e.target.value as any)}
                            className="bg-[#1a1a1a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#0df2a2]"
                        >
                            <option value="alle">Periode: Alle</option>
                            <option value="1w">Laatste week</option>
                            <option value="1m">Laatste maand</option>
                            <option value="3m">Laatste 3 maanden</option>
                            <option value="6m">Laatste 6 maanden</option>
                            <option value="1y">Laatste 1 jaar</option>
                        </select>
                    </div>

                    <div className="space-y-4">
                        {(() => {
                            // Apply filters
                            const now = new Date();
                            const filteredAppointments = appointments.filter(app => {
                                // Status Filter
                                if (statusFilter !== "alle" && app.status !== statusFilter) return false;

                                // Date Filter
                                if (dateRangeFilter !== "alle") {
                                    const appDate = new Date(app.appointment_date);
                                    let thresholdDate = new Date();
                                    if (dateRangeFilter === "1w") thresholdDate.setDate(now.getDate() - 7);
                                    if (dateRangeFilter === "1m") thresholdDate.setMonth(now.getMonth() - 1);
                                    if (dateRangeFilter === "3m") thresholdDate.setMonth(now.getMonth() - 3);
                                    if (dateRangeFilter === "6m") thresholdDate.setMonth(now.getMonth() - 6);
                                    if (dateRangeFilter === "1y") thresholdDate.setFullYear(now.getFullYear() - 1);

                                    if (appDate < thresholdDate) return false;
                                }
                                return true;
                            }).sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());

                            if (filteredAppointments.length === 0) {
                                return (
                                    <div className="text-center py-12 bg-[#1a1a1a] rounded-xl border border-gray-800">
                                        <Calendar className="mx-auto h-12 w-12 text-gray-500 mb-3" />
                                        <p className="text-gray-400">Geen afspraken gevonden met deze filters.</p>
                                    </div>
                                );
                            }

                            const total = filteredAppointments.length;
                            const geplandCount = filteredAppointments.filter(a => a.status === "gepland").length;
                            const voltooidCount = filteredAppointments.filter(a => a.status === "voltooid").length;
                            const geannuleerdCount = filteredAppointments.filter(a => a.status === "geannuleerd").length;

                            const geplandPct = Math.round((geplandCount / total) * 100);
                            const voltooidPct = Math.round((voltooidCount / total) * 100);
                            const geannuleerdPct = Math.round((geannuleerdCount / total) * 100);

                            return (
                                <>
                                    {/* Stats Breakdown Bar */}
                                    <div className="bg-[#1a1a1a] rounded-xl p-5 border border-gray-800 mb-4">
                                        <div className="flex justify-between items-end mb-3">
                                            <h3 className="text-sm font-semibold text-white">Status Overzicht</h3>
                                            <span className="text-xs text-gray-400">{total} totale afspraken</span>
                                        </div>

                                        {/* Progress Bar Container */}
                                        <div className="h-3 w-full bg-[#242424] rounded-full overflow-hidden flex mb-4">
                                            {voltooidPct > 0 && <div style={{ width: `${voltooidPct}%` }} className="h-full bg-[#0df2a2]" title={`Voltooid: ${voltooidPct}%`} />}
                                            {geplandPct > 0 && <div style={{ width: `${geplandPct}%` }} className="h-full bg-[#1E88E5]" title={`Gepland: ${geplandPct}%`} />}
                                            {geannuleerdPct > 0 && <div style={{ width: `${geannuleerdPct}%` }} className="h-full bg-[#E53935]" title={`Geannuleerd: ${geannuleerdPct}%`} />}
                                        </div>

                                        {/* Legend/Stats */}
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-[#0df2a2]" />
                                                    <span className="text-xs font-semibold text-gray-400 uppercase">Voltooid</span>
                                                </div>
                                                <span className="text-lg font-bold text-white">{voltooidPct}% <span className="text-xs font-normal text-gray-500">({voltooidCount})</span></span>
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-[#1E88E5]" />
                                                    <span className="text-xs font-semibold text-gray-400 uppercase">Gepland</span>
                                                </div>
                                                <span className="text-lg font-bold text-white">{geplandPct}% <span className="text-xs font-normal text-gray-500">({geplandCount})</span></span>
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-[#E53935]" />
                                                    <span className="text-xs font-semibold text-gray-400 uppercase">Geannuleerd</span>
                                                </div>
                                                <span className="text-lg font-bold text-white">{geannuleerdPct}% <span className="text-xs font-normal text-gray-500">({geannuleerdCount})</span></span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* List Items */}
                                    <div className="space-y-4">
                                        {filteredAppointments.map((appointment) => {
                                            const dateObj = new Date(appointment.appointment_date);
                                            return (
                                                <div key={appointment.id} className="bg-[#1a1a1a] rounded-xl p-5 border border-gray-800 hover:border-gray-700 transition-all duration-300 group">
                                                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                                        <div className="flex items-start gap-4 cursor-pointer" onClick={() => handleOpenModal(appointment)}>
                                                            <div className="bg-[#242424] p-3 rounded-lg border border-gray-700 flex flex-col items-center justify-center min-w-[70px] group-hover:border-[#0df2a2]/50 transition-colors">
                                                                <span className="text-xs text-gray-400 uppercase font-semibold">{format(dateObj, "MMM", { locale: nl })}</span>
                                                                <span className="text-2xl font-bold text-white group-hover:text-[#0df2a2] transition-colors leading-none my-0.5">{format(dateObj, "dd")}</span>
                                                                {dateObj.getFullYear() !== new Date().getFullYear() && (
                                                                    <span className="text-[10px] text-gray-500 font-medium">{format(dateObj, "yyyy")}</span>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <h3 className="text-lg font-semibold text-white flex items-center gap-2 group-hover:text-[#0df2a2] transition-colors">{appointment.client_name}</h3>
                                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-sm text-gray-400">
                                                                    <span className="flex items-center gap-1.5"><Clock size={14} className="text-[#0df2a2]" />{format(dateObj, "HH:mm")}</span>
                                                                    <span className="flex items-center gap-1.5"><MapPin size={14} className="text-[#0df2a2]" />{appointment.property_address}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between md:flex-col items-end gap-3">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[appointment.status]}`}>{appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}</span>
                                                            <div className="flex items-center gap-2 opactity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                                <button onClick={() => handleOpenModal(appointment)} className="p-2 text-gray-400 hover:text-white" title="Bewerken"><User size={18} /></button>
                                                                {appointment.status !== "voltooid" && <button onClick={() => handleStatusUpdate(appointment.id, "voltooid")} className="p-2 text-gray-400 hover:text-[#0df2a2]" title="Markeer Voltooid"><CheckCircle size={18} /></button>}
                                                                {appointment.status !== "geannuleerd" && <button onClick={() => handleStatusUpdate(appointment.id, "geannuleerd")} className="p-2 text-gray-400 hover:text-yellow-500" title="Markeer Geannuleerd"><XCircle size={18} /></button>}
                                                                <button onClick={() => handleDelete(appointment.id)} className="p-2 text-gray-400 hover:text-red-500" title="Verwijderen"><Trash2 size={18} /></button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            ) : (
                <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 shadow-xl overflow-hidden flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
                    <div className="flex-1 overflow-x-auto w-full scrollbar-thin scrollbar-thumb-emerald-500/20 scrollbar-track-transparent">
                        <div className="min-w-[800px] h-full flex flex-col">
                            {/* Calendar Header */}
                            <div className="flex border-b border-gray-800 bg-[#161616] sticky top-0 z-20">
                                {/* Time Column Placeholder Top Left */}
                                <div className="w-16 shrink-0 border-r border-gray-800 bg-[#121212]"></div>

                                {/* Days Headers */}
                                <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${weekDays.length}, minmax(0, 1fr))` }}>
                                    {weekDays.map((day) => {
                                        const isToday = isSameDay(day, today);
                                        return (
                                            <div key={`header-${day.toISOString()}`} className={`py-3 px-2 text-center border-l border-gray-800/50 first:border-l-0 relative group transition-colors ${isToday ? 'bg-[#242424]/50' : ''}`}>
                                                {isToday && <div className="absolute top-0 left-0 w-full h-1 bg-[#0df2a2]" />}
                                                <div className={`text-xs sm:text-sm font-medium uppercase tracking-wider ${isToday ? 'text-[#0df2a2]' : 'text-gray-400'}`}>
                                                    {format(day, "EEE", { locale: nl })}
                                                </div>
                                                <div className={`text-xl sm:text-2xl font-light mt-0.5 ${isToday ? 'text-white' : 'text-gray-300'}`}>
                                                    {format(day, "d MMM", { locale: nl })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Scrollable Timeline Area */}
                            <div className="flex-1 overflow-y-auto relative flex">

                                {/* Time Grid (Left Column) */}
                                <div className="w-16 shrink-0 border-r border-gray-800 bg-[#121212] relative z-10 sticky left-0">
                                    {timeSlots.map(hour => (
                                        <div key={`time-${hour}`} className="text-right pr-2 text-xs text-gray-500 font-medium" style={{ height: `${HOUR_HEIGHT}px` }}>
                                            <span className="-mt-2.5 block">{hour}:00</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Days Columns Body */}
                                <div className="flex-1 relative grid" style={{ gridTemplateColumns: `repeat(${weekDays.length}, minmax(0, 1fr))` }}>

                                    {/* Horizontal Grid lines underneath cards */}
                                    <div className="absolute inset-0 z-0 pointer-events-none w-full">
                                        {timeSlots.map(hour => (
                                            <div key={`line-${hour}`} className="border-t border-gray-800/70 w-full" style={{ height: `${HOUR_HEIGHT}px` }}></div>
                                        ))}
                                    </div>

                                    {/* Verticial Day Columns interacting */}
                                    {weekDays.map((day) => {
                                        const dayAppointments = appointments.filter(app => isSameDay(new Date(app.appointment_date), day));
                                        const isToday = isSameDay(day, today);

                                        return (
                                            <div
                                                key={`col-${day.toISOString()}`}
                                                className={`relative border-l border-gray-800/50 first:border-l-0 ${isToday ? 'bg-[#242424]/20' : ''}`}
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, day)}
                                                style={{ height: `${HOURS_COUNT * HOUR_HEIGHT}px` }}
                                            >
                                                {/* Current Time Indicator for Today */}
                                                {isToday && (() => {
                                                    const now = new Date();
                                                    const nowHour = now.getHours();
                                                    if (nowHour >= START_HOUR && nowHour <= END_HOUR) {
                                                        const frac = (nowHour - START_HOUR) + (now.getMinutes() / 60);
                                                        return <div className="absolute w-full border-t border-[#0df2a2] z-20 pointer-events-none" style={{ top: `${frac * HOUR_HEIGHT}px` }}>
                                                            <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-[#0df2a2] shadow-[0_0_10px_#0df2a2]"></div>
                                                        </div>
                                                    }
                                                    return null;
                                                })()}

                                                {/* Appointments */}
                                                {dayAppointments.map(app => (
                                                    <div
                                                        key={app.id}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, app.id)}
                                                        onDragEnd={handleDragEnd}
                                                        onDoubleClick={() => handleOpenModal(app)}
                                                        style={{ ...getPositionStyle(app.appointment_date) }}
                                                        className={`absolute left-1 right-1 sm:left-2 sm:right-2 rounded-lg p-2 sm:p-3 overflow-hidden border cursor-grab active:cursor-grabbing hover:brightness-110 hover:z-30 transition-all shadow-md group ${statusColors[app.status]}`}
                                                        title={`${format(new Date(app.appointment_date), "HH:mm")} - ${app.client_name}\n${app.property_address}\n(Dubbelklik om te bewerken)`}
                                                    >
                                                        {/* Card Content Header */}
                                                        <div className="flex justify-between items-start mb-0.5">
                                                            <span className="text-[10px] sm:text-xs font-bold leading-none tracking-wide text-white drop-shadow-sm">
                                                                {format(new Date(app.appointment_date), "HH:mm")}
                                                            </span>
                                                            {app.status === 'voltooid' && <CheckCircle size={12} className="text-[#0df2a2] shrink-0 drop-shadow-sm" />}
                                                        </div>

                                                        {/* Text Content */}
                                                        <p className="font-semibold text-xs sm:text-sm text-white truncate leading-tight drop-shadow-sm">
                                                            {app.client_name}
                                                        </p>
                                                        <div className="flex items-center gap-1 mt-0.5 opacity-90 truncate">
                                                            <MapPin size={10} className="shrink-0" />
                                                            <span className="text-[10px] sm:text-[11px] truncate leading-tight">{app.property_address}</span>
                                                        </div>
                                                    </div>
                                                ))}

                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                        >
                            <XCircle size={24} />
                        </button>

                        <h3 className="text-2xl font-bold text-white mb-6">{editingId ? "Afspraak Bewerken" : "Nieuwe Afspraak"}</h3>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSaveAppointment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Klant Naam</label>
                                <input
                                    type="text"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    className="w-full bg-[#121212] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#0df2a2] focus:ring-1 focus:ring-[#0df2a2] transition-all"
                                    placeholder="Bijv. Jan de Vries"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Klant E-mail</label>
                                <input
                                    type="email"
                                    value={clientEmail}
                                    onChange={(e) => setClientEmail(e.target.value)}
                                    className="w-full bg-[#121212] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#0df2a2] focus:ring-1 focus:ring-[#0df2a2] transition-all"
                                    placeholder="jan@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Gekoppelde Woning</label>
                                <select
                                    value={selectedPropertyId}
                                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                                    className="w-full bg-[#121212] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#0df2a2] focus:ring-1 focus:ring-[#0df2a2] transition-all"
                                >
                                    <option value="" disabled>Selecteer een woning...</option>
                                    {properties.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.address} {p.city ? `(${p.city})` : ''}
                                        </option>
                                    ))}
                                    <option value="custom">Anders (Handmatig invoeren)...</option>
                                </select>

                                {selectedPropertyId === "custom" && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300 mt-4">
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Aangepast Adres</label>
                                        <input
                                            type="text"
                                            value={propertyAddress}
                                            onChange={(e) => setPropertyAddress(e.target.value)}
                                            className="w-full bg-[#121212] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#0df2a2] focus:ring-1 focus:ring-[#0df2a2] transition-all"
                                            placeholder="Bijv. Kerkstraat 1, Amsterdam"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Datum</label>
                                    <input
                                        type="date"
                                        value={appointmentDate}
                                        onChange={(e) => setAppointmentDate(e.target.value)}
                                        className="w-full bg-[#121212] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#0df2a2] focus:ring-1 focus:ring-[#0df2a2] transition-all [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Tijd</label>
                                    <input
                                        type="time"
                                        step="900"
                                        value={appointmentTime}
                                        onChange={(e) => setAppointmentTime(e.target.value)}
                                        className="w-full bg-[#121212] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#0df2a2] focus:ring-1 focus:ring-[#0df2a2] transition-all [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                    />
                                </div>
                            </div>

                            {/* Status Editable inside Modal */}
                            {editingId && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                                    <select
                                        value={appointmentStatus}
                                        onChange={(e) => setAppointmentStatus(e.target.value as AppointmentStatus)}
                                        className="w-full bg-[#121212] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#0df2a2] focus:ring-1 focus:ring-[#0df2a2] transition-all appearance-none"
                                    >
                                        <option value="gepland">Gepland</option>
                                        <option value="voltooid">Voltooid</option>
                                        <option value="geannuleerd">Geannuleerd</option>
                                    </select>
                                </div>
                            )}

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                    disabled={isPending}
                                >
                                    Annuleren
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-6 py-2 bg-[#0df2a2] text-black font-semibold rounded-lg hover:bg-[#0df2a2]/90 transition-all duration-300 shadow-[0_0_15px_rgba(13,242,162,0.2)] hover:shadow-[0_0_20px_rgba(13,242,162,0.4)] disabled:opacity-50"
                                >
                                    {isPending ? "Bezig..." : "Opslaan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
