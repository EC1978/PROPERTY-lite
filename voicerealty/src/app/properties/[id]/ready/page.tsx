
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { generateQrCode } from '@/utils/qr'
import Link from 'next/link'
import Image from 'next/image'

export default async function PropertyReadyPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: property } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (!property) {
        redirect('/dashboard')
    }

    const publicUrl = `https://voicerealty.ai/woning/${id}` // Mock public URL
    const qrCodeUrl = await generateQrCode(publicUrl)

    // Update property with QR code URL if not set (optional, good for caching)
    if (!property.qr_code_url) {
        await supabase.from('properties').update({ qr_code_url: qrCodeUrl }).eq('id', id)
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="p-8 text-center border-b border-gray-100">
                    <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10 text-green-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Agent Gereed!</h1>
                    <p className="text-gray-500">Je woning staat online en is klaar voor bezoekers.</p>
                </div>

                <div className="p-8 space-y-6">
                    {/* QR Code Section */}
                    <div className="bg-gray-50 rounded-2xl p-6 flex flex-col items-center">
                        <img src={qrCodeUrl} alt="Property QR Code" className="w-48 h-48 mb-4 mix-blend-multiply" />
                        <p className="text-sm font-medium text-gray-500 mb-2">Scan voor Virtuele Tour</p>
                        <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-xs text-gray-400 truncate w-full text-center">
                            {publicUrl}
                        </div>
                    </div>

                    {/* Property Details Preview */}
                    <div className="flex items-center space-x-4 p-4 border border-gray-100 rounded-xl">
                        <div className="h-16 w-16 bg-gray-200 rounded-lg flex-shrink-0 bg-cover bg-center" style={{ backgroundImage: `url(${property.image_url || '/placeholder-house.jpg'})` }}></div>
                        <div>
                            <p className="font-semibold text-gray-900">{property.address}</p>
                            <p className="text-sm text-gray-500">€ {property.price?.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Link href="/dashboard" className="block w-full bg-gray-100 text-gray-700 font-bold py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors text-center">
                            Terug naar Dashboard
                        </Link>
                        <a href={qrCodeUrl} download={`qr-${id}.png`} className="block w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors text-center cursor-pointer">
                            Download QR
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
