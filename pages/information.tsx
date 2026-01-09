import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/router";

export default function InformationPage() {
    const { isOrganizer } = useAuth();
    const router = useRouter();

    return (
        <div className="container mx-auto px-4 py-8 pb-32 max-w-2xl text-slate-200">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-3xl font-bold font-display uppercase tracking-tight">Information</h1>
            </div>

            <div className="space-y-8 bg-white/5 p-6 rounded-3xl border border-white/10">

                {/* Legal Links Section */}
                <section>
                    <h2 className="text-xl font-bold mb-4 text-brand-oredge">Legal</h2>
                    <div className="flex flex-col gap-3">
                        <Link href="/imprint" className="p-3 bg-black/20 rounded-xl hover:bg-black/40 transition-colors flex justify-between items-center group">
                            <span>Imprint</span>
                            <span className="text-white/20 group-hover:text-white/60">→</span>
                        </Link>
                        <Link href="/privacy-policy" className="p-3 bg-black/20 rounded-xl hover:bg-black/40 transition-colors flex justify-between items-center group">
                            <span>Privacy Policy</span>
                            <span className="text-white/20 group-hover:text-white/60">→</span>
                        </Link>
                        <Link href="/cookie-policy" className="p-3 bg-black/20 rounded-xl hover:bg-black/40 transition-colors flex justify-between items-center group">
                            <span>Cookie Policy</span>
                            <span className="text-white/20 group-hover:text-white/60">→</span>
                        </Link>
                        <Link href="/terms" className="p-3 bg-black/20 rounded-xl hover:bg-black/40 transition-colors flex justify-between items-center group">
                            <span>Terms of Service</span>
                            <span className="text-white/20 group-hover:text-white/60">→</span>
                        </Link>
                    </div>
                </section>

                {/* Contact Section */}
                {!isOrganizer && (
                    <section className="pt-4 border-t border-white/10">
                        <h2 className="text-xl font-bold mb-2 text-brand-grellow">Contact</h2>
                        <p className="text-sm text-slate-400 mb-2">Want to publish events?</p>
                        <a href="mailto:events@commoncause.cc" className="text-brand-grellow hover:underline text-lg">
                            events@commoncause.cc
                        </a>
                    </section>
                )}

                {/* Common World Section */}
                <section className="pt-4 border-t border-white/10">
                    <h2 className="text-xl font-bold mb-2 text-brand-blurple">Network</h2>
                    <div className="bg-black/20 p-4 rounded-xl">
                        <h3 className="font-bold text-white mb-1">Common Cause</h3>
                        <a href="https://commoncause.cc" target="_blank" rel="noopener noreferrer" className="text-brand-blurple hover:underline">
                            commoncause.cc
                        </a>
                        <p className="text-xs text-slate-500 mt-2">Part of the Common Cause ecosystem.</p>
                    </div>
                </section>

                <div className="pt-8 text-center text-xs text-slate-600">
                    &copy; {new Date().getFullYear()} Common Events. All rights reserved.
                </div>
            </div>
        </div>
    );
}
