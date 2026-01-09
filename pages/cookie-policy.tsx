import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CookiePolicyPage() {
    return (
        <div className="min-h-screen w-full bg-black flex flex-col items-center py-12 px-4">
            {/* Back Button */}
            <div className="w-full max-w-3xl mb-6">
                <Link href="/">
                    <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white transition-colors hover:bg-black/80">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                </Link>
            </div>

            {/* Content Card */}
            <div className="w-full max-w-3xl bg-black border-2 border-white rounded-xl p-8 shadow-xl text-white">
                <h1 className="text-3xl font-bold mb-6">Cookie Policy</h1>
                <p className="text-white/70 mb-8">Last Updated: December 8, 2025</p>

                <div className="space-y-8">
                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-white">1. What Are Cookies?</h2>
                        <p className="text-white/80 leading-relaxed">
                            Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide information to the owners of the site.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-white">2. How We Use Cookies</h2>
                        <p className="text-white/80 mb-2">We use cookies to:</p>
                        <ul className="list-disc pl-5 space-y-1 text-white/80">
                            <li>Keep you signed in to your account.</li>
                            <li>Remember your preferences (e.g., map filters).</li>
                            <li>Analyze how our Service is used.</li>
                            <li>Ensure the security of our Service.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-white">3. Types of Cookies We Use</h2>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-white mb-2">3.1. Strictly Necessary Cookies</h3>
                                <p className="text-white/80 mb-3">
                                    These cookies are essential for the website to function properly. They enable basic functions like page navigation and access to secure areas of the website.
                                </p>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-white/80 border-collapse">
                                        <thead>
                                            <tr className="border-b border-white/20">
                                                <th className="py-2 pr-4 font-semibold text-white">Name</th>
                                                <th className="py-2 pr-4 font-semibold text-white">Provider</th>
                                                <th className="py-2 font-semibold text-white">Purpose</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/10">
                                            <tr>
                                                <td className="py-2 pr-4 font-mono text-xs">sb-[project-id]-auth-token</td>
                                                <td className="py-2 pr-4">Supabase</td>
                                                <td className="py-2">Manages user session and authentication.</td>
                                            </tr>
                                            <tr>
                                                <td className="py-2 pr-4 font-mono text-xs">csrf-token</td>
                                                <td className="py-2 pr-4">Common Events</td>
                                                <td className="py-2">Protects against CSRF attacks.</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium text-white mb-2">3.2. Functional Cookies</h3>
                                <p className="text-white/80 mb-3">
                                    These cookies enable the website to provide enhanced functionality and personalization.
                                </p>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-white/80 border-collapse">
                                        <thead>
                                            <tr className="border-b border-white/20">
                                                <th className="py-2 pr-4 font-semibold text-white">Name</th>
                                                <th className="py-2 pr-4 font-semibold text-white">Provider</th>
                                                <th className="py-2 font-semibold text-white">Purpose</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/10">
                                            <tr>
                                                <td className="py-2 pr-4 font-mono text-xs">vercel-live-feedback</td>
                                                <td className="py-2 pr-4">Vercel</td>
                                                <td className="py-2">Used for the Vercel toolbar (dev/preview).</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium text-white mb-2">3.3. Third-Party Cookies</h3>
                                <p className="text-white/80 leading-relaxed">
                                    We use services from third parties that may set cookies on your device. We do not control these cookies.
                                </p>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-white/80">
                                    <li><strong>Google Maps:</strong> Google may set cookies to remember your preferences and for security purposes when you interact with the map.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-white">4. Managing Cookies</h2>
                        <p className="text-white/80 leading-relaxed">
                            You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from being placed. If you do this, however, you may have to manually adjust some preferences every time you visit a site and some services and functionalities (like logging in) may not work.
                        </p>
                        <p className="text-white/80 mt-4">
                            To manage cookies in your browser, please refer to your browser&apos;s help documentation (Chrome, Firefox, Safari, Edge, etc.).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-white">5. Updates to This Policy</h2>
                        <p className="text-white/80 leading-relaxed">
                            We may update this Cookie Policy from time to time. Please re-visit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
