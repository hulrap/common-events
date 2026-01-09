import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
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
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-white/70 mb-8">Last Updated: December 8, 2025</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4 text-white">1. Introduction</h2>
            <p className="text-white/80 leading-relaxed">
              Welcome to <strong>Common Events</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your personal data and respecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services (collectively, the &quot;Service&quot;).
            </p>
            <p className="text-white/80 leading-relaxed mt-2">
              We process personal data in accordance with the <strong>General Data Protection Regulation (GDPR)</strong> (Regulation (EU) 2016/679) and other applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-white">2. Controller</h2>
            <p className="text-white/80 leading-relaxed">
              The data controller responsible for the processing of your personal data on this website is:
            </p>
            <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-white font-medium">[Your Company/Organization Name]</p>
              <p className="text-white/70">[Your Address]</p>
              <p className="text-white/70">[City, Zip Code, Country]</p>
              <p className="text-white/70 mt-2"><strong>Email:</strong> events@commoncause.cc</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-white">3. Data We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-white mb-2">3.1. Information You Provide to Us</h3>
                <ul className="list-disc pl-5 space-y-2 text-white/80">
                  <li><strong>Account Data:</strong> When you register for an account, we collect your email address and password (hashed). If you sign up via a third-party provider, we receive your email and basic profile info.</li>
                  <li><strong>Profile Data:</strong> If you are an organizer or venue owner, we may collect your name, organization name, and contact details.</li>
                  <li><strong>User Content:</strong> Events, venue details, and other content you post to the Service.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">3.2. Information Collected Automatically</h3>
                <ul className="list-disc pl-5 space-y-2 text-white/80">
                  <li><strong>Technical Data:</strong> IP address, browser type and version, time zone setting, operating system, and platform.</li>
                  <li><strong>Usage Data:</strong> Information about how you use our website, such as pages visited, time spent, and clickstream data.</li>
                  <li><strong>Location Data:</strong> If you grant permission, we may collect your approximate location to display relevant events on the map.</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-white">4. Legal Basis and Purpose of Processing</h2>
            <p className="text-white/80 mb-4">We process your data based on the following legal grounds (Art. 6 GDPR):</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-white/80 border-collapse">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="py-2 pr-4 font-semibold text-white">Purpose</th>
                    <th className="py-2 font-semibold text-white">Legal Basis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  <tr>
                    <td className="py-2 pr-4">Providing the Service (accounts, events, likes)</td>
                    <td className="py-2">Contractual Necessity (Art. 6(1)(b))</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Security & Fraud Prevention</td>
                    <td className="py-2">Legitimate Interest (Art. 6(1)(f))</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Analytics</td>
                    <td className="py-2">Legitimate Interest (Art. 6(1)(f)) or Consent</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Legal Compliance</td>
                    <td className="py-2">Legal Obligation (Art. 6(1)(c))</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-white">5. Third-Party Services and Data Processors</h2>
            <p className="text-white/80 mb-4">We use third-party service providers to help us deliver our Service. These providers act as data processors and process data on our behalf.</p>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-2">5.1. Hosting and Infrastructure: Vercel</h3>
                <ul className="list-disc pl-5 space-y-1 text-white/80">
                  <li><strong>Provider:</strong> Vercel Inc., USA.</li>
                  <li><strong>Server Location:</strong> Frankfurt, Germany (eu-central-1).</li>
                  <li><strong>Purpose:</strong> Hosting, serverless functions, content delivery.</li>
                  <li><strong>Data:</strong> IP addresses, server logs.</li>
                  <li><strong>Compliance:</strong> EU-U.S. Data Privacy Framework.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">5.2. Database and Authentication: Supabase</h3>
                <ul className="list-disc pl-5 space-y-1 text-white/80">
                  <li><strong>Provider:</strong> Supabase, Inc., Singapore.</li>
                  <li><strong>Server Location:</strong> Frankfurt, Germany (eu-central-1).</li>
                  <li><strong>Purpose:</strong> Authentication, database, storage.</li>
                  <li><strong>Data:</strong> Emails, passwords, user IDs.</li>
                  <li><strong>Compliance:</strong> Standard Contractual Clauses (SCCs), AWS hosting in Frankfurt.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">5.3. Maps: Google Maps Platform</h3>
                <ul className="list-disc pl-5 space-y-1 text-white/80">
                  <li><strong>Provider:</strong> Google Ireland Limited, Ireland.</li>
                  <li><strong>Purpose:</strong> Interactive maps.</li>
                  <li><strong>Data:</strong> IP address, location data, map interactions.</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-white">6. International Data Transfers</h2>
            <p className="text-white/80 leading-relaxed">
              Some of our service providers are located outside the European Economic Area (EEA), specifically in the USA. We ensure that appropriate safeguards are in place for such transfers, such as the <strong>EU-U.S. Data Privacy Framework</strong> certification or <strong>Standard Contractual Clauses (SCCs)</strong> approved by the European Commission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-white">7. Data Retention</h2>
            <p className="text-white/80 leading-relaxed">
              We retain your personal data only for as long as necessary to fulfill the purposes for which we collected it. Account data is retained until you delete your account. Server logs are typically retained for a short period (e.g., 30 days) for security auditing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-white">8. Your Rights</h2>
            <p className="text-white/80 mb-2">Under the GDPR, you have the following rights:</p>
            <ul className="list-disc pl-5 space-y-1 text-white/80">
              <li>Right to Access (Art. 15)</li>
              <li>Right to Rectification (Art. 16)</li>
              <li>Right to Erasure (&quot;Right to be Forgotten&quot;) (Art. 17)</li>
              <li>Right to Restriction (Art. 18)</li>
              <li>Right to Data Portability (Art. 20)</li>
              <li>Right to Object (Art. 21)</li>
            </ul>
            <p className="text-white/80 mt-4">
              To exercise these rights, please contact us at the email address provided in Section 2.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-white">9. Changes to This Policy</h2>
            <p className="text-white/80 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last Updated&quot; date.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
