"use client";

import Logo from '@/components/Logo';
import { useState, useMemo, useEffect, useTransition } from "react";
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
import {
    Calendar as CalendarIcon, Clock, MapPin, Plus, User, Trash2,
    CheckCircle, XCircle, LayoutGrid, List, Search, ChevronLeft,
    ChevronRight, Filter, Settings, Menu, Bell, Download,
    CalendarDays, CalendarPlus, X
} from "lucide-react";
import {
    format, addDays, startOfToday, startOfWeek, isSameDay, addWeeks,
    subWeeks, startOfDay, startOfMonth, endOfMonth, eachDayOfInterval,
    addMonths, subMonths, getDay, differenceInDays, endOfWeek, isToday
} from "date-fns";
import { nl } from "date-fns/locale";

interface AgendaClientProps {
    initialAppointments: Appointment[];
    properties: { id: string; address: string | null; city: string | null }[];
    serverNow: string;
}

// Configuration
const START_HOUR = 0;
const END_HOUR = 23;
const HOURS_COUNT = 24;
const HOUR_HEIGHT = 80;

const statusBorder: any = {
    gepland: "border-[#0df2a2]",
    voltooid: "border-emerald-500",
    geannuleerd: "border-zinc-700 opacity-60",
};

const statusBg: any = {
    gepland: "bg-[#0df2a2]/5",
    voltooid: "bg-emerald-500/5",
    geannuleerd: "bg-zinc-900/40",
};

const statusDot: any = {
    gepland: "bg-[#0df2a2]",
    voltooid: "bg-emerald-500",
    geannuleerd: "bg-zinc-700",
};

const badgeColors: any = {
    gepland: "bg-[#0df2a2] text-[#0A0A0A]",
    voltooid: "bg-emerald-500 text-white",
    geannuleerd: "bg-zinc-800 text-zinc-500",
};

const statusColors: any = {
    gepland: "border-l-[#0df2a2] bg-[#0df2a2]/5",
    voltooid: "border-l-emerald-500 bg-emerald-500/5",
    geannuleerd: "border-l-zinc-700 bg-zinc-900/40 opacity-60 grayscale",
};

export default function AgendaClient({ initialAppointments, properties, serverNow }: AgendaClientProps) {
    // --- State Management ---
    const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
    const [calendarView, setCalendarView] = useState<"dag" | "week" | "maand">("week");
    const [mounted, setMounted] = useState(false);

    // Handle initial mobile state and mounting
    useEffect(() => {
        setMounted(true);
        if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
            setCalendarView("dag");
        }
    }, []);

    // Core Date State
    const [selectedDate, setSelectedDate] = useState(() => {
        const base = serverNow ? new Date(serverNow) : new Date();
        return startOfDay(base);
    });

    // Mini Calendar Navigation State
    const [miniCalendarDate, setMiniCalendarDate] = useState(() => {
        const base = serverNow ? new Date(serverNow) : new Date();
        return startOfMonth(base);
    });

    // Settings
    const [showWeekends, setShowWeekends] = useState(false);
    const [showHolidays, setShowHolidays] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isPending, startTransition] = useTransition();

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [clientName, setClientName] = useState("");
    const [clientEmail, setClientEmail] = useState("");
    const [selectedPropertyId, setSelectedPropertyId] = useState<string | "custom">("");
    const [propertyAddress, setPropertyAddress] = useState("");
    const [appointmentDate, setAppointmentDate] = useState("");
    const [appointmentTime, setAppointmentTime] = useState("");
    const [appointmentStatus, setAppointmentStatus] = useState<AppointmentStatus>("gepland");
    const [error, setError] = useState("");

    // --- Persistence ---
    useEffect(() => {
        const savedWeekends = localStorage.getItem("agenda_showWeekends");
        if (savedWeekends !== null) setShowWeekends(savedWeekends === "true");

        const savedHolidays = localStorage.getItem("agenda_showHolidays");
        if (savedHolidays !== null) setShowHolidays(savedHolidays === "true");

        const savedViewMode = localStorage.getItem("agenda_viewMode");
        if (savedViewMode === "list" || savedViewMode === "calendar") setViewMode(savedViewMode as any);

        const savedCalView = localStorage.getItem("agenda_calendarView");
        if (["dag", "week", "maand"].includes(savedCalView || "")) setCalendarView(savedCalView as any);
    }, []);

    const toggleWeekends = () => {
        const newVal = !showWeekends;
        setShowWeekends(newVal);
        localStorage.setItem("agenda_showWeekends", String(newVal));
    };

    const toggleHolidays = () => {
        const newVal = !showHolidays;
        setShowHolidays(newVal);
        localStorage.setItem("agenda_showHolidays", String(newVal));
    };

    const handleCalViewChange = (v: "dag" | "week" | "maand") => {
        setCalendarView(v);
        setViewMode("calendar");
        localStorage.setItem("agenda_calendarView", v);
        localStorage.setItem("agenda_viewMode", "calendar");
    };

    // --- Computed Values ---
    const today = useMemo(() => startOfToday(), []);
    const timeSlots = Array.from({ length: 24 }).map((_, i) => i);

    const weekDays = useMemo(() => {
        const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
        return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    }, [selectedDate]);

    const miniCalendarDays = useMemo(() => {
        const start = startOfWeek(startOfMonth(miniCalendarDate), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(miniCalendarDate), { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [miniCalendarDate]);

    const filteredAppointments = useMemo(() => {
        return appointments.filter(app =>
            app.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.property_address?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [appointments, searchQuery]);

    const navigate = (direction: 'prev' | 'next' | 'today') => {
        if (direction === 'today') {
            setSelectedDate(today);
            setMiniCalendarDate(startOfMonth(today));
            return;
        }

        const amount = direction === 'prev' ? -1 : 1;
        if (calendarView === 'dag') setSelectedDate(prev => addDays(prev, amount));
        else if (calendarView === 'week') setSelectedDate(prev => addWeeks(prev, amount));
        else if (calendarView === 'maand') setSelectedDate(prev => addMonths(prev, amount));
    };

    // Holidays
    const getHoliday = (date: Date) => {
        if (!showHolidays) return null;
        const m = date.getMonth() + 1;
        const d = date.getDate();
        const y = date.getFullYear();

        // NL National
        if (m === 1 && d === 1) return { name: "Nieuwjaar", type: "national" };
        if (m === 4 && d === 27) return { name: "Koningsdag", type: "national" };
        if (m === 5 && d === 5) return { name: "Bevrijdingsdag", type: "national" };
        if (m === 12 && d === 25) return { name: "1e Kerstdag", type: "national" };
        if (m === 12 && d === 26) return { name: "2e Kerstdag", type: "national" };

        // Islamic Holidays (2026 Approx)
        if (y === 2026) {
            if (m === 2 && d === 18) return { name: "Start Ramadan", type: "islamic" };
            if (m === 3 && (d >= 20 && d <= 22)) return { name: "Suikerfeest", type: "islamic" };
            if (m === 5 && (d >= 27 && d <= 29)) return { name: "Offerfeest", type: "islamic" };
        }
        return null;
    };

    const getPositionStyle = (dateString: string) => {
        const date = new Date(dateString);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const top = (hours + minutes / 60) * HOUR_HEIGHT;
        return {
            top: `${top}px`,
            height: `${HOUR_HEIGHT - 4}px`,
        };
    };

    // --- Action Handlers ---
    const handleOpenModal = (app?: Appointment) => {
        if (app) {
            setEditingId(app.id);
            setClientName(app.client_name);
            setClientEmail(app.client_email);
            setAppointmentStatus(app.status);
            const dateObj = new Date(app.appointment_date);
            setAppointmentDate(format(dateObj, "yyyy-MM-dd"));
            setAppointmentTime(format(dateObj, "HH:mm"));

            const matchingProp = properties.find(p => p.address === app.property_address);
            if (matchingProp) {
                setSelectedPropertyId(matchingProp.id);
                setPropertyAddress("");
            } else {
                setSelectedPropertyId("custom");
                setPropertyAddress(app.property_address || "");
            }
        } else {
            setEditingId(null);
            setClientName("");
            setClientEmail("");
            setAppointmentStatus("gepland");
            setAppointmentDate(format(selectedDate, "yyyy-MM-dd"));
            setAppointmentTime("09:00");
            setSelectedPropertyId("");
            setPropertyAddress("");
        }
        setIsModalOpen(true);
    };

    const handleSaveAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        let finalAddress = propertyAddress;
        if (selectedPropertyId && selectedPropertyId !== "custom") {
            const prop = properties.find(p => p.id === selectedPropertyId);
            if (prop) finalAddress = prop.address || "";
        }

        if (!clientName || !finalAddress || !appointmentDate || !appointmentTime) {
            setError("Vul alle verplichte velden in.");
            return;
        }

        const dateTime = new Date(`${appointmentDate}T${appointmentTime}:00`);
        const input = {
            client_name: clientName,
            client_email: clientEmail,
            property_address: finalAddress,
            appointment_date: dateTime.toISOString(),
            status: appointmentStatus,
        };

        startTransition(async () => {
            if (editingId) {
                const res = await updateAppointmentDetails(editingId, input);
                if (!res.success) setError(res.error || "Fout bij bijwerken");
                else window.location.reload();
            } else {
                const res = await createAppointment(input as CreateAppointmentInput);
                if (!res.success) setError(res.error || "Fout bij aanmaken");
                else window.location.reload();
            }
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Weet je zeker dat je deze afspraak wilt verwijderen?")) return;
        startTransition(async () => {
            const res = await deleteAppointment(id);
            if (res.success) window.location.reload();
        });
    };

    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData("appointment_id", id);
        (e.target as HTMLElement).style.opacity = '0.4';
    };

    const handleDrop = async (e: React.DragEvent, date: Date) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("appointment_id");
        if (!id) return;

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const y = e.clientY - rect.top;
        const totalHours = y / HOUR_HEIGHT;
        const hours = Math.floor(totalHours);
        let minutes = Math.floor((totalHours - hours) * 60);

        // Snap to 15m
        minutes = Math.round(minutes / 15) * 15;
        const finalHours = minutes === 60 ? hours + 1 : hours;
        const finalMinutes = minutes === 60 ? 0 : minutes;

        const targetDate = new Date(date);
        targetDate.setHours(finalHours, finalMinutes, 0, 0);

        startTransition(async () => {
            const res = await updateAppointmentDate(id, targetDate.toISOString());
            if (res.success) {
                // Update local state for immediate feedback
                setAppointments(prev => prev.map(a => a.id === id ? { ...a, appointment_date: targetDate.toISOString() } : a));
            } else {
                setError(res.error || "Fout bij verplaatsen");
            }
        });
    };

    // --- Layout Components ---

    return (
        <div className="flex bg-[#0A0A0A] h-[calc(100vh-80px)] lg:h-[calc(100vh-100px)] overflow-hidden relative">
            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-[110] w-[300px] bg-[#0A0A0A] border-r border-white/5 flex flex-col gap-6 p-6 transition-all duration-500 ease-in-out
                lg:relative lg:z-10 lg:w-[320px] lg:p-8 lg:gap-8
                ${isSidebarOpen ? "translate-x-0 ml-0" : "-translate-x-full lg:-ml-[320px]"}
            `}>
                <div className="flex items-center justify-between lg:hidden mb-4">
                    <Logo isUppercase={false} textClassName="text-sm" iconSize="size-6" />
                    <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-zinc-500"><X size={20} /></button>
                </div>

                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center justify-center gap-3 bg-white hover:bg-[#0df2a2] text-[#0A0A0A] py-4 lg:py-5 px-6 lg:px-8 rounded-2xl font-black text-[9px] lg:text-[10px] uppercase tracking-[0.2em] transition-all shadow-[0_20px_40px_rgba(255,255,255,0.05)] active:scale-95 italic"
                >
                    <Plus size={18} strokeWidth={3} /> Nieuwe Afspraak
                </button>

                {/* Mini Calendar Container */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] italic">{format(miniCalendarDate, "MMMM yyyy", { locale: nl })}</span>
                        <div className="flex gap-2">
                            <button onClick={() => setMiniCalendarDate(prev => subMonths(prev, 1))} className="size-8 flex items-center justify-center hover:bg-white/5 rounded-full text-zinc-500 transition-colors"><ChevronLeft size={16} /></button>
                            <button onClick={() => setMiniCalendarDate(prev => addMonths(prev, 1))} className="size-8 flex items-center justify-center hover:bg-white/5 rounded-full text-zinc-500 transition-colors"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 text-[8px] font-black text-zinc-600 text-center mb-2 uppercase tracking-tighter">
                        {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map(d => <div key={d}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {miniCalendarDays.map((day, i) => {
                            const isCurrent = day.getMonth() === miniCalendarDate.getMonth();
                            const isSel = isSameDay(day, selectedDate);
                            const hasAppts = appointments.some(a => isSameDay(new Date(a.appointment_date), day));

                            return (
                                <button
                                    key={i}
                                    onClick={() => setSelectedDate(day)}
                                    className={`
                                        size-9 rounded-full flex flex-col items-center justify-center text-[10px] font-black transition-all relative
                                        ${isSel ? 'bg-[#0df2a2] text-[#0A0A0A] shadow-lg shadow-[#0df2a2]/20' : isCurrent ? 'text-zinc-400 hover:bg-white/10' : 'text-zinc-800'}
                                    `}
                                >
                                    {format(day, 'd')}
                                    {hasAppts && !isSel && <div className="absolute bottom-1.5 size-1 bg-[#0df2a2] rounded-full" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-auto space-y-6 pt-8 border-t border-white/5">
                    <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] italic">Mijn Filters</h3>
                    <div className="space-y-4">
                        <button onClick={toggleWeekends} className="flex items-center gap-3 w-full group">
                            <div className={`size-5 rounded-lg border flex items-center justify-center transition-all ${showWeekends ? "bg-[#0df2a2] border-[#0df2a2]" : "border-white/10 bg-white/5"}`}>
                                {showWeekends && <CheckCircle size={12} className="text-[#0A0A0A]" />}
                            </div>
                            <span className="text-[10px] font-black uppercase text-zinc-400 group-hover:text-white tracking-widest transition-colors">Weekenden</span>
                        </button>
                        <button onClick={toggleHolidays} className="flex items-center gap-3 w-full group">
                            <div className={`size-5 rounded-lg border flex items-center justify-center transition-all ${showHolidays ? "bg-[#0df2a2] border-[#0df2a2]" : "border-white/10 bg-white/5"}`}>
                                {showHolidays && <CheckCircle size={12} className="text-[#0A0A0A]" />}
                            </div>
                            <span className="text-[10px] font-black uppercase text-zinc-400 group-hover:text-white tracking-widest transition-colors">Feestdagen</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#0A0A0A]">
                {/* Header */}
                <header className="h-20 lg:h-24 border-b border-white/5 flex items-center bg-[#0A0A0A]/80 backdrop-blur-xl z-[60] px-4 lg:px-8 shrink-0">
                    {/* Left: Menu & Brand */}
                    <div className="flex items-center gap-3 lg:gap-6 shrink-0 mr-4 lg:mr-8">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/5 rounded-xl text-zinc-500 hover:text-[#0df2a2] transition-all"><Menu size={20} /></button>
                        <Logo showText={false} className="xl:hidden" />
                        <Logo showText={true} className="hidden xl:flex" />
                    </div>

                    {/* Middle: Navigation Controls */}
                    <div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0">
                        <button onClick={() => navigate('today')} className="px-3 lg:px-5 py-2 rounded-xl border border-white/10 bg-white/5 text-[8px] lg:text-[10px] font-black uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-white/10 transition-all shrink-0 italic">Vandaag</button>
                        <div className="flex items-center gap-0.5 shrink-0">
                            <button onClick={() => navigate('prev')} className="size-8 lg:size-10 flex items-center justify-center hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-all"><ChevronLeft size={20} /></button>
                            <button onClick={() => navigate('next')} className="size-8 lg:size-10 flex items-center justify-center hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-all"><ChevronRight size={20} /></button>
                        </div>
                        <span className="text-sm lg:text-xl font-black text-white italic ml-2 lg:ml-4 capitalize tracking-tight truncate max-w-[120px] sm:max-w-none">
                            {calendarView === 'dag' ? format(selectedDate, 'EEEE d MMMM yyyy', { locale: nl }) : format(selectedDate, 'MMMM yyyy', { locale: nl })}
                        </span>
                    </div>

                    {/* Right: Search & View Switcher */}
                    <div className="flex items-center gap-2 lg:gap-6 shrink-0 ml-4 lg:ml-8">
                        <div className="relative group hidden md:block">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-3.5 text-zinc-600 group-focus-within:text-[#0df2a2] transition-colors" />
                            <input
                                type="text"
                                placeholder="Zoek..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                suppressHydrationWarning
                                className="bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-[10px] font-black text-white focus:outline-none focus:border-[#0df2a2]/30 transition-all w-32 xl:w-48 placeholder:italic placeholder:text-zinc-800"
                            />
                        </div>

                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 shrink-0">
                            {[
                                { id: 'dag', label: 'D' },
                                { id: 'week', label: 'W' },
                                { id: 'maand', label: 'M' }
                            ].map(v => (
                                <button
                                    key={v.id}
                                    onClick={() => handleCalViewChange(v.id as any)}
                                    className={`w-8 lg:w-16 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all italic ${calendarView === v.id && viewMode === "calendar" ? "bg-[#0df2a2] text-[#0A0A0A] shadow-lg shadow-[#0df2a2]/20" : "text-zinc-500 hover:text-white"}`}
                                >
                                    <span className="hidden lg:inline">{v.id === 'dag' ? 'Dag' : v.id === 'week' ? 'Week' : 'Maand'}</span>
                                    <span className="lg:hidden">{v.label}</span>
                                </button>
                            ))}
                            <div className="w-px h-3 bg-white/10 mx-1.5 self-center" />
                            <button
                                onClick={() => { setViewMode("list"); localStorage.setItem("agenda_viewMode", "list"); }}
                                className={`px-3 lg:px-5 py-1.5 rounded-lg text-[8px] lg:text-[9px] font-black uppercase tracking-wider transition-all italic ${viewMode === "list" ? "bg-[#0df2a2] text-[#0A0A0A] shadow-lg shadow-[#0df2a2]/20" : "text-zinc-500 hover:text-white"}`}
                            >
                                Lijst
                            </button>
                        </div>
                    </div>
                </header>


                {/* Viewport */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {viewMode === "list" ? (
                        <div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12 custom-scrollbar">
                            <div className="max-w-4xl mx-auto space-y-8 lg:space-y-12">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-6 lg:pb-10 gap-4">
                                    <h3 className="text-2xl lg:text-4xl font-black italic tracking-tighter text-white uppercase leading-none">GEPLANDE <span className="text-[#0df2a2]">AFSPRAKEN</span></h3>
                                    <div className="flex items-center gap-4">
                                        <span className="text-[8px] lg:text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] italic">{filteredAppointments.length} RESULTATEN</span>
                                        <button className="flex items-center gap-2 px-3 lg:px-4 py-1.5 lg:py-2 bg-white/5 rounded-xl text-[8px] lg:text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all"><Download size={12} /> EXPORT</button>
                                    </div>
                                </div>
                                {filteredAppointments.length === 0 ? (
                                    <div className="text-center py-20 lg:py-32 text-zinc-800 font-black uppercase tracking-[0.5em] text-[10px] lg:text-[12px] italic border-2 border-dashed border-white/5 rounded-[2rem] lg:rounded-[3rem]">Geen data gevonden</div>
                                ) : (
                                    <div className="space-y-4 lg:space-y-6">
                                        {filteredAppointments.sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()).map(app => (
                                            <div key={app.id} className="bg-[#121212]/50 border border-white/5 p-4 sm:p-8 rounded-3xl lg:rounded-[2.5rem] flex flex-col sm:flex-row sm:items-center justify-between group hover:border-[#0df2a2]/30 transition-all hover:bg-[#121212] relative overflow-hidden gap-4">
                                                <div className="flex items-center gap-4 lg:gap-10">
                                                    <div className="flex flex-col items-center justify-center p-3 lg:p-6 bg-[#0df2a2]/10 rounded-2xl lg:rounded-[1.5rem] min-w-[60px] lg:min-w-[90px] shadow-inner">
                                                        <span className="text-[8px] lg:text-[11px] font-black text-[#0df2a2] uppercase tracking-[0.2em] italic mb-1">{format(new Date(app.appointment_date), "MMM", { locale: nl })}</span>
                                                        <span className="text-xl lg:text-4xl font-black text-white italic leading-none">{format(new Date(app.appointment_date), "dd")}</span>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3 lg:gap-4 mb-1.5 lg:mb-3">
                                                            <div className={`px-2 lg:px-3 py-0.5 lg:py-1 rounded-full text-[7px] lg:text-[8px] font-black uppercase tracking-[0.2em] shadow-sm ${badgeColors[app.status]}`}>{app.status}</div>
                                                            <div className="flex items-center gap-1.5 text-[9px] lg:text-[11px] font-black text-zinc-600 italic"><Clock size={10} className="text-[#0df2a2]" /> {format(new Date(app.appointment_date), "HH:mm")}</div>
                                                        </div>
                                                        <h4 className="text-lg lg:text-2xl font-black text-white uppercase italic tracking-tight mb-1 lg:mb-2 group-hover:text-[#0df2a2] transition-colors line-clamp-1">{app.client_name}</h4>
                                                        <div className="flex items-center gap-2 text-[8px] lg:text-[10px] text-zinc-500 font-bold uppercase tracking-[0.1em] line-clamp-1"><MapPin size={10} className="text-zinc-700" /> {app.property_address}</div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 sm:gap-4 sm:opacity-0 group-hover:opacity-100 transition-all sm:translate-x-4 group-hover:translate-x-0">
                                                    <button onClick={() => handleOpenModal(app)} className="h-10 sm:size-14 flex-1 sm:flex-none rounded-xl lg:rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-500 hover:text-[#0df2a2] hover:bg-[#0df2a2]/10 transition-all active:scale-90"><Settings size={18} /></button>
                                                    <button onClick={() => handleDelete(app.id)} className="h-10 sm:size-14 flex-1 sm:flex-none rounded-xl lg:rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90"><Trash2 size={18} /></button>
                                                </div>
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0df2a2] opacity-0 group-hover:opacity-100 transition-all hidden sm:block" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar-h relative z-10">
                            {calendarView === 'maand' ? (
                                <div className="h-full flex flex-col overflow-hidden min-w-[700px] lg:min-w-0">
                                    <div className="grid grid-cols-7 border-b border-white/5 bg-[#0A0A0A]/80 shrink-0 sticky top-0 z-30">
                                        {["MAANDAG", "DINSDAG", "WOENSDAG", "DONDERDAG", "VRIJDAG", "ZATERDAG", "ZONDAG"].map((d, i) => (
                                            <div key={i} className={`py-6 text-center text-[10px] font-black text-zinc-700 tracking-[0.3em] italic ${!showWeekends && i > 4 ? 'hidden' : ''}`}>{d}</div>
                                        ))}
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                                        <div className="grid grid-cols-7 min-h-full border-l border-white/[0.03]">
                                            {(() => {
                                                const mStart = startOfMonth(selectedDate);
                                                const days = eachDayOfInterval({
                                                    start: startOfWeek(mStart, { weekStartsOn: 1 }),
                                                    end: endOfWeek(endOfMonth(mStart), { weekStartsOn: 1 })
                                                });
                                                return days.map((day, i) => {
                                                    const isCurrMonth = day.getMonth() === mStart.getMonth();
                                                    const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                                                    const holiday = getHoliday(day);
                                                    const dayAppts = filteredAppointments.filter(a => isSameDay(new Date(a.appointment_date), day));

                                                    if (!showWeekends && isWeekend) return null;

                                                    return (
                                                        <div
                                                            key={i}
                                                            onClick={() => { setSelectedDate(day); handleCalViewChange('dag'); }}
                                                            className={`
                                                                min-h-[160px] border-r border-b border-white/[0.03] p-5 flex flex-col gap-3 transition-all hover:bg-white/[0.02] cursor-pointer relative group
                                                                ${!isCurrMonth ? 'opacity-10 pointer-events-none' : 'bg-transparent'}
                                                                ${isToday(day) ? 'bg-[#0df2a2]/[0.02]' : ''}
                                                            `}
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <span className={`size-9 flex items-center justify-center rounded-2xl text-[14px] font-black italic transition-all ${isToday(day) ? "bg-[#0df2a2] text-[#0A0A0A] shadow-[0_10px_20px_rgba(13,242,162,0.3)]" : "text-zinc-600 group-hover:text-white"}`}>
                                                                    {format(day, 'd')}
                                                                </span>
                                                                {holiday && (
                                                                    <div className={`mt-1.5 px-3 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest italic animate-pulse ${holiday.type === 'islamic' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-[#0df2a2]/20 text-[#0df2a2] border border-[#0df2a2]/30'}`} title={holiday.name}>{holiday.name}</div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col gap-1.5 overflow-hidden">
                                                                {dayAppts.slice(0, 4).map(app => (
                                                                    <div key={app.id} className={`px-2.5 py-1.5 rounded-xl border-l-[3px] text-[8px] font-black uppercase italic truncate transition-all ${statusColors[app.status]} hover:translate-x-1 hover:brightness-125`}>
                                                                        <span className="text-white/40 mr-1">{format(new Date(app.appointment_date), "HH:mm")}</span> {app.client_name}
                                                                    </div>
                                                                ))}
                                                                {dayAppts.length > 4 && <div className="text-[7px] font-black text-zinc-800 uppercase italic ml-2 mt-1 tracking-widest">+{dayAppts.length - 4} ANDERE ITEMS</div>}
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col overflow-hidden min-w-[900px]">
                                    {/* Column Headers */}
                                    <div className="flex border-b border-white/5 bg-[#0A0A0A]/50 shrink-0 sticky top-0 z-40">
                                        <div className="w-[100px] shrink-0 border-r border-white/5 flex items-end justify-center pb-4"><Clock className="text-zinc-800" size={16} /></div>
                                        <div className="flex-1 flex">
                                            {(calendarView === 'dag' ? [selectedDate] : weekDays).map((day, i) => {
                                                const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                                                const holiday = getHoliday(day);
                                                if (!showWeekends && isWeekend) return null;

                                                return (
                                                    <div key={i} className={`flex-1 py-6 px-4 flex flex-col items-center justify-center border-r border-white/5 group relative ${isToday(day) ? 'bg-[#0df2a2]/[0.02]' : ''}`}>
                                                        <span className={`text-[8px] font-black uppercase tracking-[0.3em] mb-1 italic ${isToday(day) ? 'text-[#0df2a2]' : 'text-zinc-700'}`}>
                                                            {format(day, 'EEEE', { locale: nl }).toUpperCase()}
                                                        </span>
                                                        <div className="flex items-center gap-3">
                                                            <span className={`text-4xl font-black italic tracking-tighter leading-none ${isToday(day) ? 'text-white' : 'text-zinc-400 group-hover:text-white transition-colors'}`}>
                                                                {format(day, 'd')}
                                                            </span>
                                                            {holiday && (
                                                                <div className={`px-2.5 py-1 rounded-xl text-[7px] font-black uppercase tracking-[0.1em] italic border ${holiday.type === 'islamic' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-[#0df2a2]/10 text-[#0df2a2] border-[#0df2a2]/20'}`}>
                                                                    {holiday.name}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {isToday(day) && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#0df2a2] shadow-[0_0_20px_rgba(13,242,162,0.5)]" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Scrollable Timeline */}
                                    <div className="flex-1 overflow-y-auto custom-scrollbar custom-scrollbar-v relative">
                                        <div className="flex min-h-[1920px]">
                                            {/* Hours Column */}
                                            <div className="w-[100px] shrink-0 border-r border-white/5 bg-[#0A0A0A]/80 sticky left-0 z-30">
                                                {timeSlots.map(h => (
                                                    <div key={h} className="h-[80px] border-b border-white/[0.03] flex items-start justify-center pt-2 group">
                                                        <span className="text-[11px] font-black text-zinc-800 tracking-tighter italic group-hover:text-zinc-500 transition-colors">{String(h).padStart(2, '0')}:00</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Grid */}
                                            <div className="flex-1 flex overflow-visible">
                                                {(calendarView === 'dag' ? [selectedDate] : weekDays).map((day, i) => {
                                                    const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                                                    if (!showWeekends && isWeekend) return null;

                                                    return (
                                                        <div
                                                            key={i}
                                                            className="flex-1 relative border-r border-white/[0.03] group/col"
                                                            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                                                            onDrop={(e) => handleDrop(e, day)}
                                                        >
                                                            {/* Empty Slots */}
                                                            {timeSlots.map(h => (
                                                                <div
                                                                    key={h}
                                                                    onClick={() => {
                                                                        setAppointmentDate(format(day, "yyyy-MM-dd"));
                                                                        setAppointmentTime(`${String(h).padStart(2, '0')}:00`);
                                                                        setIsModalOpen(true);
                                                                    }}
                                                                    className="h-[80px] border-b border-white/[0.02] hover:bg-[#0df2a2]/[0.02] transition-colors cursor-crosshair relative z-0 group/slot"
                                                                >
                                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-opacity">
                                                                        <Plus size={16} className="text-[#0df2a2]/30" />
                                                                    </div>
                                                                </div>
                                                            ))}

                                                            {/* Current Time Indicator */}
                                                            {mounted && isToday(day) && (
                                                                <div
                                                                    className="absolute left-0 right-0 h-[2px] bg-[#0df2a2] z-50 pointer-events-none flex items-center shadow-[0_0_20px_rgba(13,242,162,0.6)]"
                                                                    style={{ top: `${(new Date().getHours() + new Date().getMinutes() / 60) * HOUR_HEIGHT}px` }}
                                                                >
                                                                    <div className="size-2 rounded-full bg-[#0df2a2] -ml-1 shadow-[0_0_10px_#0df2a2]"></div>
                                                                </div>
                                                            )}

                                                            {/* Logic-Based Appointments */}
                                                            {mounted && filteredAppointments.filter(a => isSameDay(new Date(a.appointment_date), day)).map(app => (
                                                                <div
                                                                    key={app.id}
                                                                    draggable
                                                                    onDragStart={(e) => handleDragStart(e, app.id)}
                                                                    onDragEnd={(e) => (e.target as HTMLElement).style.opacity = '1'}
                                                                    onClick={() => handleOpenModal(app)}
                                                                    style={getPositionStyle(app.appointment_date)}
                                                                    className={`
                                                                        absolute left-1 right-1 rounded-lg px-3 py-2 shadow-lg backdrop-blur-md z-20 cursor-grab active:cursor-grabbing transition-all hover:z-50 group/card border-l-[3px]
                                                                        ${statusBorder[app.status]} ${statusBg[app.status]} hover:brightness-125
                                                                    `}
                                                                >
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <div className={`size-1.5 rounded-full ${statusDot[app.status]}`} title={app.status}></div>
                                                                        <span className="text-[10px] font-black text-white/50 tracking-widest italic">{format(new Date(app.appointment_date), "HH:mm")}</span>
                                                                    </div>

                                                                    <div className="flex flex-col min-w-0">
                                                                        <h4 className="text-[11px] font-black text-white uppercase italic tracking-tighter truncate leading-tight group-hover:text-[#0df2a2] transition-colors">
                                                                            {app.client_name}
                                                                        </h4>
                                                                        <div className="flex items-center gap-1.5 text-[8px] text-zinc-600 font-bold uppercase tracking-widest truncate mt-0.5">
                                                                            <MapPin size={8} className="text-zinc-800 shrink-0" />
                                                                            <span className="truncate opacity-60 group-hover:opacity-100 transition-opacity">{app.property_address}</span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 transition-all scale-75 hover:scale-100">
                                                                        <Trash2 size={12} className="text-zinc-600 hover:text-red-500 transition-colors pointer-events-auto cursor-pointer" onClick={(e) => { e.stopPropagation(); handleDelete(app.id); }} />
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
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-[#0A0A0A]/95 backdrop-blur-2xl animate-in fade-in duration-500">
                    <div className="bg-[#121212] border border-white/5 rounded-[2.5rem] lg:rounded-[3rem] p-6 sm:p-8 lg:p-10 w-full max-w-2xl shadow-[0_0_150px_rgba(13,242,162,0.15)] relative animate-in zoom-in-95 duration-700 overflow-y-auto max-h-[90vh] scrollbar-hide">
                        <div className="flex justify-between items-start mb-6 lg:mb-10">
                            <div>
                                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black italic tracking-tighter text-white uppercase leading-none">
                                    {editingId ? "AFSPRAAK" : "NIEUWE"} <span className="text-[#0df2a2]">{editingId ? "AANPASSEN" : "PLANNING"}</span>
                                </h3>
                                <p className="text-[9px] sm:text-[10px] text-zinc-600 font-black uppercase tracking-[0.4em] mt-2 sm:mt-3 italic ml-1 opacity-80">Beheer bezichtigingen & klantdossiers</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="size-10 sm:size-12 rounded-full border border-white/5 bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all active:scale-90"><XCircle size={24} className="sm:size-6" /></button>
                        </div>

                        {error && <div className="mb-10 p-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] italic animate-pulse">{error}</div>}

                        <form onSubmit={handleSaveAppointment} className="space-y-4 sm:space-y-5 lg:space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                <div className="space-y-2">
                                    <label className="text-[8px] lg:text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-4 lg:ml-5 italic">VOLLEDIGE NAAM *</label>
                                    <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} required className="w-full bg-white/[0.03] border border-white/5 rounded-xl lg:rounded-2xl px-6 lg:px-8 py-3 lg:py-4 text-[11px] lg:text-[12px] font-black text-white focus:outline-none focus:border-[#0df2a2]/30 focus:bg-white/[0.06] transition-all placeholder:text-zinc-800 italic" placeholder="JAN DE VRIES" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[8px] lg:text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-4 lg:ml-5 italic">E-MAILADRES</label>
                                    <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="w-full bg-white/[0.03] border border-white/5 rounded-xl lg:rounded-2xl px-6 lg:px-8 py-3 lg:py-4 text-[11px] lg:text-[12px] font-black text-white focus:outline-none focus:border-[#0df2a2]/30 focus:bg-white/[0.06] transition-all placeholder:text-zinc-800 italic" placeholder="JAN@EXAMPLE.COM" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-5 italic">OBJECT SELECTIE *</label>
                                <div className="relative group/select">
                                    <select
                                        value={selectedPropertyId}
                                        onChange={(e) => setSelectedPropertyId(e.target.value)}
                                        required
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-8 py-4 text-[12px] font-black text-white focus:outline-none focus:border-[#0df2a2]/30 focus:bg-white/[0.06] transition-all appearance-none cursor-pointer italic"
                                    >
                                        <option value="" disabled className="bg-[#121212]">SELECTEER EEN WONING...</option>
                                        {properties.map(p => <option key={p.id} value={p.id} className="bg-[#121212]">{p.address?.toUpperCase()}</option>)}
                                        <option value="custom" className="bg-[#121212]">ANDERS (HANDMATIG)...</option>
                                    </select>
                                    <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-700 items-center flex gap-3">
                                        <span className="text-[8px] font-black uppercase text-zinc-800 tracking-widest group-hover/select:text-zinc-500 transition-colors">WONING KIEZEN</span>
                                        <ChevronRight size={12} className="rotate-90 group-hover/select:text-[#0df2a2] transition-colors" />
                                    </div>
                                </div>
                            </div>

                            {selectedPropertyId === "custom" && (
                                <div className="space-y-4 animate-in slide-in-from-top-6 duration-700">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-6 italic">LOCATIE ADRES *</label>
                                    <input type="text" value={propertyAddress} onChange={(e) => setPropertyAddress(e.target.value)} required className="w-full bg-white/5 border border-white/5 rounded-[1.5rem] px-10 py-6 text-[13px] font-black text-white focus:outline-none focus:border-[#0df2a2]/30 transition-all placeholder:text-zinc-800 italic" placeholder="STRAATNAAM 123, STAD" />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-5 italic">DATUM *</label>
                                    <input type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} required className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-8 py-4 text-[12px] font-black text-white focus:outline-none focus:border-[#0df2a2]/30 focus:bg-white/[0.06] transition-all [color-scheme:dark] italic outline-none" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-5 italic">TIJDSTIP *</label>
                                    <input type="time" step="900" value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)} required className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-8 py-4 text-[12px] font-black text-white focus:outline-none focus:border-[#0df2a2]/30 focus:bg-white/[0.06] transition-all [color-scheme:dark] italic outline-none" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-5 italic">STATUS CATEGORIE</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {["gepland", "voltooid", "geannuleerd"].map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setAppointmentStatus(s as AppointmentStatus)}
                                            className={`py-3 rounded-xl border text-[9px] font-black uppercase tracking-[0.3em] transition-all italic ${appointmentStatus === s ? 'bg-[#0df2a2] border-[#0df2a2] text-[#0A0A0A] shadow-[0_10px_20px_rgba(13,242,162,0.2)]' : 'bg-white/5 border-white/5 text-zinc-600 hover:border-white/20'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 lg:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="text-[9px] font-black italic uppercase tracking-[0.4em] text-zinc-700 hover:text-white transition-all underline underline-offset-[10px] decoration-[#0df2a2]/30 hover:decoration-[#0df2a2]">SLUITEN</button>
                                <button type="submit" disabled={isPending} className="w-full sm:w-auto bg-[#0df2a2] hover:bg-white text-[#0A0A0A] px-12 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-[0_15px_30px_rgba(13,242,162,0.2)] hover:shadow-[#0df2a2]/40 active:scale-95 italic group flex items-center justify-center gap-4">
                                    {isPending ? "VERWERKEN..." : (
                                        <>
                                            <CalendarPlus size={16} className="group-hover:rotate-12 transition-transform" />
                                            <span>PLANNEN</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar-v::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar-h::-webkit-scrollbar {
                    height: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track,
                .custom-scrollbar-v::-webkit-scrollbar-track,
                .custom-scrollbar-h::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb,
                .custom-scrollbar-v::-webkit-scrollbar-thumb,
                .custom-scrollbar-h::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover,
                .custom-scrollbar-v::-webkit-scrollbar-thumb:hover,
                .custom-scrollbar-h::-webkit-scrollbar-thumb:hover {
                    background: rgba(13, 242, 162, 0.2);
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .shadow-glow {
                    box-shadow: 0 0 15px #0df2a2, 0 0 30px rgba(13, 242, 162, 0.3);
                }
                input[type="date"]::-webkit-calendar-picker-indicator,
                input[type="time"]::-webkit-calendar-picker-indicator {
                    filter: invert(1);
                    cursor: pointer;
                    opacity: 0.5;
                }
                input[type="date"]::-webkit-calendar-picker-indicator:hover,
                input[type="time"]::-webkit-calendar-picker-indicator:hover {
                    opacity: 1;
                }
            `}</style>
        </div>
    );
}
