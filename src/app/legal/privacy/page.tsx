import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Money Sense handles visitor data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16 prose">
      <h1>Privacy Policy</h1>
      <p>Last updated: March 2025</p>
      <h2>What we collect</h2>
      <p>
        We aim to collect as little personal information as possible. Finance calculators run entirely
        in your browser; we do not store the numbers you enter.
      </p>
      <p>
        If you use the admin area, we store account credentials (email and hashed password) necessary
        to manage content.
      </p>
      <h2>Analytics</h2>
      <p>
        We may use privacy-conscious analytics (for example Plausible or a similar tool) that does not
        use cookies for tracking and does not collect personally identifiable information.
      </p>
      <h2>Cookies</h2>
      <p>
        Essential cookies may be used for authentication in the admin area. We do not use advertising
        or cross-site tracking cookies.
      </p>
      <h2>Contact</h2>
      <p>For privacy questions, contact the site administrator.</p>
    </div>
  );
}
