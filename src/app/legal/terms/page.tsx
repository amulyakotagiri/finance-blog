import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms governing use of the Money Sense website.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16 prose">
      <h1>Terms of Use</h1>
      <p>Last updated: March 2025</p>
      <p>
        By using Money Sense you agree to these terms. Content is provided for educational purposes
        only and does not create any professional relationship.
      </p>
      <h2>Acceptable use</h2>
      <p>
        You may read articles and use the tools for personal, non-commercial purposes. You may not
        scrape the site at a rate that degrades service, attempt to access the admin area without
        authorization, or misrepresent the content as personalized advice.
      </p>
      <h2>Intellectual property</h2>
      <p>
        Articles and design are owned by the site operator unless otherwise noted. Brief quotations
        with attribution are permitted under fair use.
      </p>
      <h2>Limitation of liability</h2>
      <p>
        The site is provided “as is.” We are not liable for decisions you make based on information
        found here.
      </p>
    </div>
  );
}
