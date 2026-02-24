"use client";

import { useState } from "react";
import { render } from "@react-email/render";
import { RequestReviewEmail } from "@/components/emails/RequestReviewEmail";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EmailTemplatePreview() {
    const [html, setHtml] = useState<string>("");

    // Determine HTML asyncly to allow passing complex component rendering to client rendering logic safely
    useState(() => {
        const fetchHtml = async () => {
            const result = await render(
                <RequestReviewEmail />
            );
            setHtml(result);
        }
        fetchHtml();
    })

    return (
        <div className="min-h-screen bg-[#0A0A0A] p-4 text-white">
            <div className="max-w-4xl mx-auto flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Terug
                    </Link>
                    <h1 className="text-xl font-bold">Email Template Preview</h1>
                    <div className="w-16"></div> {/* Spacer for centering */}
                </div>

                <div className="bg-[#161616] p-4 rounded-xl border border-white/10 shadow-2xl">
                    <div className="border-b border-white/10 pb-4 mb-4">
                        <p className="text-sm"><span className="text-white/40">From:</span> no-reply@voicerealty.ai</p>
                        <p className="text-sm"><span className="text-white/40">To:</span> klant@example.com</p>
                        <p className="text-sm"><span className="text-white/40">Subject:</span> Hoe was uw ervaring?</p>
                    </div>

                    <div className="bg-[#0A0A0A] rounded overflow-hidden min-h-[600px]">
                        {html ? (
                            <iframe
                                srcDoc={html}
                                className="w-full h-[700px] border-none"
                                title="Email Preview"
                            />
                        ) : (
                            <div className="w-full h-[700px] flex items-center justify-center text-white/40">
                                Loading preview...
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
