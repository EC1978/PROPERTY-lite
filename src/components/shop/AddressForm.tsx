'use client'

import { useState } from 'react';

interface AddressFormProps {
    onClose: () => void;
    onSave: (address: any) => void;
}

export function AddressForm({ onClose, onSave }: AddressFormProps) {
    const [formData, setFormData] = useState({
        voornaam: '',
        achternaam: '',
        telefoon: '',
        email: '',
        bedrijf: '',
        straat: '',
        nummer: '',
        extra: '',
        postcode: '',
        plaats: '',
        land: 'Nederland',
        btw: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0A0A0A]/90 backdrop-blur-xl" onClick={onClose}></div>

            <div className="relative w-full max-w-2xl bg-[#1A1D1C] border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="flex items-center gap-4 px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                    <button
                        onClick={onClose}
                        className="size-10 rounded-full flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-white">arrow_back</span>
                    </button>
                    <h2 className="text-xl font-extrabold tracking-tight">Nieuw contact</h2>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Voornaam */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                <label htmlFor="voornaam">Voornaam</label>
                                <span>{formData.voornaam.length} / 35</span>
                            </div>
                            <input
                                type="text"
                                id="voornaam"
                                name="voornaam"
                                maxLength={35}
                                value={formData.voornaam}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#0df2a2]/50 focus:ring-0 transition-all outline-none"
                                required
                            />
                        </div>

                        {/* Achternaam */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                <label htmlFor="achternaam">Achternaam</label>
                                <span>{formData.achternaam.length} / 35</span>
                            </div>
                            <input
                                type="text"
                                id="achternaam"
                                name="achternaam"
                                maxLength={35}
                                value={formData.achternaam}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#0df2a2]/50 focus:ring-0 transition-all outline-none"
                                required
                            />
                        </div>
                    </div>

                    {/* Telefoon */}
                    <div className="space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Telefoonnummer</div>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">call</span>
                            <input
                                type="tel"
                                name="telefoon"
                                placeholder="Vul je telefoonnummer in"
                                value={formData.telefoon}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:border-[#0df2a2]/50 focus:ring-0 transition-all outline-none"
                                required
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
                            <label>Email</label>
                            <span>{formData.email.length} / 50</span>
                        </div>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">mail</span>
                            <input
                                type="email"
                                name="email"
                                maxLength={50}
                                placeholder="e.g. work@yourcompany.com"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:border-[#0df2a2]/50 focus:ring-0 transition-all outline-none"
                                required
                            />
                        </div>
                    </div>

                    {/* Address Section */}
                    <div className="pt-4 border-t border-white/5">
                        <h3 className="text-lg font-extrabold tracking-tight mb-4">Adres</h3>

                        <div className="space-y-4">
                            {/* Bedrijfsnaam */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                    <label>Bedrijfsnaam</label>
                                    <span>{formData.bedrijf.length} / 32</span>
                                </div>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">business_center</span>
                                    <input
                                        type="text"
                                        name="bedrijf"
                                        maxLength={32}
                                        placeholder="Zoek bedrijf"
                                        value={formData.bedrijf}
                                        onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:border-[#0df2a2]/50 focus:ring-0 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            {/* Straat + Nummer */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2 space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                        <label>Straatnaam</label>
                                        <span>{formData.straat.length} / 30</span>
                                    </div>
                                    <input
                                        type="text"
                                        name="straat"
                                        maxLength={30}
                                        placeholder="Straatnaam"
                                        value={formData.straat}
                                        onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#0df2a2]/50 focus:ring-0 transition-all outline-none"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                        <label>Nummer</label>
                                        <span>{formData.nummer.length} / 16</span>
                                    </div>
                                    <input
                                        type="text"
                                        name="nummer"
                                        maxLength={16}
                                        placeholder="Nummer"
                                        value={formData.nummer}
                                        onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#0df2a2]/50 focus:ring-0 transition-all outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Extra adresregel */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                    <label>Extra adresregel</label>
                                    <span>{formData.extra.length} / 32</span>
                                </div>
                                <input
                                    type="text"
                                    name="extra"
                                    maxLength={32}
                                    placeholder="Bv. Appartement 2a"
                                    value={formData.extra}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#0df2a2]/50 focus:ring-0 transition-all outline-none"
                                />
                            </div>

                            {/* Postcode + Plaats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                        <label>Postcode</label>
                                        <span>{formData.postcode.length} / 10</span>
                                    </div>
                                    <input
                                        type="text"
                                        name="postcode"
                                        maxLength={10}
                                        placeholder="1234AB"
                                        value={formData.postcode}
                                        onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#0df2a2]/50 focus:ring-0 transition-all outline-none"
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Plaats</div>
                                    <input
                                        type="text"
                                        name="plaats"
                                        placeholder="Plaats"
                                        value={formData.plaats}
                                        onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#0df2a2]/50 focus:ring-0 transition-all outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Land */}
                            <div className="space-y-1.5">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Land</div>
                                <select
                                    name="land"
                                    value={formData.land}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#0df2a2]/50 focus:ring-0 transition-all outline-none appearance-none cursor-pointer"
                                >
                                    <option value="Nederland" className="bg-[#1A1D1C]">Nederland</option>
                                    <option value="België" className="bg-[#1A1D1C]">België</option>
                                    <option value="Duitsland" className="bg-[#1A1D1C]">Duitsland</option>
                                </select>
                            </div>

                            {/* BTW nummer */}
                            <div className="space-y-1.5">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Btw-nummer <span className="text-white/20">(optioneel)</span></div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="btw"
                                        placeholder="NL 123456789 B01"
                                        value={formData.btw}
                                        onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#0df2a2]/50 focus:ring-0 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            {/* Default Address Checkbox */}
                            <div className="flex items-center gap-3 pt-2">
                                <label className="relative flex items-center cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        name="is_default"
                                        checked={(formData as any).is_default || false}
                                        onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                                    />
                                    <div className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2.5px] after:left-[3px] after:bg-white/40 after:rounded-full after:h-[15px] after:w-[15px] after:transition-all peer-checked:bg-[#0df2a2] peer-checked:after:bg-[#0A0A0A] peer-checked:after:opacity-100"></div>
                                    <span className="ml-3 text-[11px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">Instellen als standaard adres</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-6">
                        <button
                            type="submit"
                            className="w-full bg-[#0df2a2] hover:bg-[#0df2a2]/90 text-[#0A0A0A] font-black py-4 rounded-2xl shadow-[0_10px_30px_rgba(13,242,162,0.2)] flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 uppercase"
                        >
                            Adres Opslaan
                            <span className="material-symbols-outlined">save</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
