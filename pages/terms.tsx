import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <p className="text-white/70 mb-8">Last Updated: December 8, 2025</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4 text-white">1. Acceptance of Terms</h2>
            <p className="text-white/80 leading-relaxed">
              By accessing or using <strong>Common Events</strong> (the &quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-white">2. Description of Service</h2>
            <p className="text-white/80 leading-relaxed">
              Common Events is a platform designed to facilitate the discovery of events. We aggregate event information from various public sources to help users find events they might be interested in and to help organizers and venues reach a wider audience.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-white">3. Content and Copyright Policy</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-2">3.1. Nature of Content</h3>
                <p className="text-white/80 leading-relaxed">
                  The Service displays information about events, including titles, descriptions, dates, times, locations, and associated imagery (&quot;Event Content&quot;).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-white mb-2">3.2. Source of Information</h3>
                <p className="text-white/80 leading-relaxed mb-2">
                  Much of the Event Content on our Service is aggregated from publicly available sources on the internet. We believe that aggregating this information serves a <strong>beneficial public purpose</strong> by:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-white/80">
                  <li>Facilitating event discovery for the public.</li>
                  <li>Providing free promotion and increased visibility for event organizers and venues.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-white mb-2">3.3. Fair Use and Informational Purpose</h3>
                <p className="text-white/80 leading-relaxed">
                  Our use of Event Content, including text and images, is for <strong>informational and discovery purposes only</strong>. We do not claim ownership of the copyright for third-party event descriptions or imagery. We operate under the principle that this use constitutes &quot;fair use&quot; or is otherwise permitted as the information is factual and publicly available for the purpose of promotion.
                </p>
              </div>

              <div className="bg-white/5 p-5 rounded-lg border border-white/10">
                <h3 className="text-lg font-medium text-white mb-2">3.4. Notice and Takedown Policy</h3>
                <p className="text-white/80 leading-relaxed mb-4">
                  We respect the intellectual property rights of others and the preferences of event organizers. <strong>If you are a rights holder, organizer, or venue owner and you wish for your event or content to be removed from our Service, we will happily comply with your request immediately.</strong>
                </p>
                <p className="text-white/80">
                  To request removal, please contact us at: <a href="mailto:takedown-request-events@commoncause.cc" className="text-brand-purple hover:underline">takedown-request-events@commoncause.cc</a>
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-white mb-2">3.5. Claiming Your Event</h3>
                <p className="text-white/80 leading-relaxed mb-2">
                  Alternatively, instead of removal, we encourage organizers and venue owners to <strong>claim their events or venues</strong>. By verifying your identity, we can grant you access to:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-white/80">
                  <li>Manage and update your event details directly.</li>
                  <li>Control your brand presence on our platform.</li>
                  <li>Gain insights into how users are interacting with your events.</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-white">4. User Conduct</h2>
            <p className="text-white/80 mb-2">You agree not to use the Service to:</p>
            <ul className="list-disc pl-5 space-y-1 text-white/80">
              <li>Violate any applicable law or regulation.</li>
              <li>Submit false or misleading information.</li>
              <li>Interfere with or disrupt the integrity or performance of the Service.</li>
              <li>Attempt to gain unauthorized access to the Service or its related systems.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-white">5. Disclaimer of Warranties</h2>
            <p className="text-white/80 leading-relaxed mb-4">
              The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. We make no warranties, expressed or implied, regarding the accuracy, completeness, or reliability of any Event Content, or the availability of the Service.
            </p>
            <p className="text-white/80 leading-relaxed">
              <strong>We are not responsible for any cancellations, changes, or quality issues regarding the events listed on our Service.</strong> Users are encouraged to verify event details with the official organizer before attending.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-white">6. Limitation of Liability</h2>
            <p className="text-white/80 leading-relaxed">
              To the fullest extent permitted by law, Common Events shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, resulting from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-white">7. Contact Us</h2>
            <p className="text-white/80">
              If you have any questions about these Terms, please contact us at: <a href="mailto:events@commoncause.cc" className="text-brand-purple hover:underline">events@commoncause.cc</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
