export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">
              Last updated: January 2025
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">
                1. Introduction
              </h2>
              <p>
                At RbxAssets ("we," "our," or "us"), we are committed to
                protecting your privacy. This Privacy Policy explains how we
                collect, use, disclose, and safeguard your information when you
                visit our website and use our services.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">
                2. Information We Collect
              </h2>
              <div className="space-y-4 ml-4 border-l-2 border-border pl-4">
                <div>
                  <h3 className="font-semibold text-foreground">
                    2.1 Information You Provide Directly
                  </h3>
                  <ul className="list-disc pl-5 space-y-2 mt-2">
                    <li>Account registration information (name, email, password)</li>
                    <li>Profile information (avatar, bio, location)</li>
                    <li>Payment information (processed securely by third parties)</li>
                    <li>Asset upload details and descriptions</li>
                    <li>Communication with us through contact forms or support</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground">
                    2.2 Information Collected Automatically
                  </h3>
                  <ul className="list-disc pl-5 space-y-2 mt-2">
                    <li>Browser and device information</li>
                    <li>IP address and location data</li>
                    <li>Pages visited and time spent on our platform</li>
                    <li>Download and purchase history</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground">
                    2.3 Third-Party Information
                  </h3>
                  <p className="text-sm mt-2">
                    We may receive information about you from third-party
                    services, analytics providers, and advertising partners.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">
                3. How We Use Your Information
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Provide and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send promotional emails and marketing communications</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Analyze usage patterns to enhance user experience</li>
                <li>Comply with legal obligations</li>
                <li>Prevent fraudulent activities and protect security</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">
                4. Data Sharing and Disclosure
              </h2>
              <p>
                We do not sell your personal information. However, we may share
                your information in the following circumstances:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Service Providers:</strong> Third parties who assist
                  us in operating our website and services
                </li>
                <li>
                  <strong>Legal Requirements:</strong> When required by law or
                  to protect our rights
                </li>
                <li>
                  <strong>Business Transfers:</strong> In the event of a merger,
                  acquisition, or bankruptcy
                </li>
                <li>
                  <strong>Public Profile:</strong> Your username and profile
                  information may be publicly visible on the platform
                </li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">
                5. Data Retention
              </h2>
              <p>
                We retain your personal information for as long as necessary to
                provide our services and fulfill the purposes outlined in this
                policy. You can request deletion of your account and associated
                data at any time.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">
                6. Security
              </h2>
              <p>
                We implement comprehensive security measures to protect your
                information, including encryption, firewalls, and secure
                authentication. However, no method of transmission over the
                internet is 100% secure.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">
                7. Your Rights and Choices
              </h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your account</li>
                <li>Opt-out of marketing communications</li>
                <li>Control cookie preferences</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">
                8. Cookies
              </h2>
              <p>
                Our website uses cookies to enhance your experience. For more
                information, please visit our <a href="/cookies" className="text-primary hover:underline">Cookie Policy</a>.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">
                9. Children's Privacy
              </h2>
              <p>
                RbxAssets is not intended for children under 13. We do not
                knowingly collect personal information from children under 13.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">
                10. Contact Us
              </h2>
              <p>
                If you have questions about this Privacy Policy, please contact
                us at:
              </p>
              <div className="bg-secondary/30 border border-border rounded-lg p-4 mt-4">
                <p className="font-semibold text-foreground">RbxAssets Privacy Team</p>
                <p>Email: privacy@rbxassets.com</p>
                <p>Address: 123 Creator Street, San Francisco, CA 94102</p>
              </div>
            </section>

            <section className="space-y-4 bg-secondary/30 border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground">
                Policy Updates
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We will
                notify you of significant changes via email or by posting a
                prominent notice on our website.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
