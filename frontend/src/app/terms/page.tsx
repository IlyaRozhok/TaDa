"use client";

import React from "react";
import { useTranslation } from "../hooks/useTranslation";
import Footer from "../components/Footer";
import Link from "next/link";

const TermsOfUsePage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 z-50 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <img
                src="/black-logo.svg"
                alt="TADA Logo"
                className="h-8 sm:h-10"
              />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Terms of Use</h1>
          
          {/* Company Information */}
          <p className="text-gray-700 leading-relaxed mb-6">
            TA-DA.ME LTD | Company number 16647779 | Registered office: 23
            Alphabet Mews, London, England, SW9 0FN | Last updated: 24 March
            2026
          </p>

          {/* Introduction */}
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed mb-6">
              These Terms of Use ("Terms") govern access to and use of the TA-DA platform, website and related services operated by TA-DA.ME LTD ("TA-DA", "we", "us", "our").
            </p>
            
            <p className="text-gray-700 leading-relaxed mb-6">
              By creating an account, clicking to accept, using the platform or otherwise accessing our services, you agree to be bound by these Terms. If you do not agree, you must not use the platform.
            </p>
            
            <p className="text-gray-700 leading-relaxed mb-8">
              These Terms operate alongside our Privacy Policy and any additional written terms that may apply to a specific landlord relationship, commercial arrangement, promotion or service feature.
            </p>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="space-y-12">
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">1. About the platform</h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-6">
                TA-DA provides a digital platform designed to help prospective tenants, landlords and property operators connect, communicate and manage certain administrative steps relating to viewings, applications, introductions and tenancy-related processes.
              </p>
              
              <p className="mb-6">
                Unless we expressly agree otherwise in a separate written agreement, TA-DA acts only as a platform provider and introducing intermediary. We do not own, lease, manage or control properties and we are not automatically a party to any tenancy agreement between a landlord and a tenant.
              </p>
              
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>We do not guarantee that any property will be available, suitable, lawful or free from defects;</li>
                <li>we do not guarantee that any tenant will be accepted or that any tenancy will complete;</li>
                <li>we do not provide legal, tax, financial, surveying or property-management advice; and</li>
                <li>unless separately agreed in writing, we do not act with authority to bind a landlord or tenant to a tenancy agreement.</li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Eligibility and account registration</h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-6">
                You may use the platform only if you are at least 18 years old and have legal capacity to enter into a binding contract. You must ensure that all information you provide is accurate, complete, current and not misleading.
              </p>
              
              <p className="mb-6">
                You are responsible for maintaining the confidentiality of your account credentials and for activity carried out through your account. You must notify us promptly if you believe your account has been accessed without authorisation.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">3. User conduct</h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-4">You must use the platform lawfully and fairly. You must not:</p>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>provide false, misleading or fraudulent information or documents;</li>
                <li>upload unlawful, infringing, defamatory or harmful content;</li>
                <li>interfere with the platform, attempt unauthorised access or bypass security measures;</li>
                <li>scrape, harvest, copy or exploit platform data except as permitted by law or by us in writing;</li>
                <li>use the platform in a way that breaches housing, consumer, anti-discrimination, sanctions, AML, data-protection or other applicable laws.</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">4. Property listings and information</h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-6">
                Landlords and property operators are responsible for the accuracy, completeness and legality of property listings and related statements, documents, images and disclosures. Tenants are responsible for conducting their own independent checks before entering into a tenancy agreement.
              </p>
              
              <p className="mb-6">
                TA-DA may moderate, organise, remove or refuse content, listings or users where reasonably necessary for quality control, legal compliance, fraud prevention, safety or platform integrity, but we are not obliged to verify every listing or statement published by a user.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Introductions and landlord fees</h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-6">
                For the purposes of these Terms, an "Introduction" occurs when TA-DA makes available to a landlord or property operator sufficient identifying details of a prospective tenant, or otherwise materially facilitates contact between them, through the platform.
              </p>
              
              <p className="mb-6">
                Where a landlord, property operator or related party enters into a tenancy agreement with a tenant introduced through the platform within six months after the Introduction, TA-DA may treat that tenancy as resulting from the Introduction unless there is clear evidence to the contrary.
              </p>
              
              <p className="mb-6">
                Landlords and property operators agree not to circumvent the platform in order to avoid fees or commissions owed to TA-DA. If landlord or operator fees apply, they will be set out in a separate commercial agreement, fee schedule, onboarding flow or other written communication accepted by the relevant landlord or operator. Rights to recover earned fees survive termination of these Terms.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Payments, deposits and third-party services</h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-6">
                The platform may enable payment initiation, payment collection, payouts, deposit registration, identity checks, credit checks, referencing or utility referrals using third-party providers. Those services may also be subject to the provider's own terms and privacy notices.
              </p>
              
              <p className="mb-6">
                Unless the law or a separate written agreement states otherwise, TA-DA is not a bank, trustee or deposit-protection scheme and does not guarantee the performance of third-party providers. Where rent, deposits or other sums pass through or are arranged via the platform, TA-DA's role is limited to the process expressly described on the platform or in the relevant written agreement.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Landlord responsibilities</h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>ensuring property listings are accurate and not misleading;</li>
                <li>complying with housing, safety, licensing, right-to-rent, deposit-protection, consumer and anti-discrimination laws;</li>
                <li>ensuring the property is lawfully available to let and fit for occupation where required by law;</li>
                <li>deciding whether to accept a tenant and entering into the tenancy agreement directly or through an authorised representative;</li>
                <li>fulfilling all landlord duties before, during and after the tenancy.</li>
              </ul>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">8. Tenant responsibilities</h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>providing accurate and complete information and documents;</li>
                <li>carrying out your own review of any property, tenancy terms, landlord identity and affordability before signing;</li>
                <li>complying with the tenancy agreement and applicable law;</li>
                <li>ensuring any guarantor or third party whose data you provide has authority for you to share it.</li>
              </ul>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">9. Verification, referencing and risk checks</h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-6">
                TA-DA may facilitate checks through third-party providers, including identity verification, fraud screening, affordability assessment and credit referencing. Results may inform a landlord's decision-making but do not amount to legal, financial or tenancy advice and do not guarantee acceptance, suitability or safety.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              10. Intellectual property
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-6">
                The platform, including its software, branding, design, text,
                graphics, databases and other content created by or for TA-DA,
                is owned by us or our licensors and is protected by
                intellectual-property laws. We grant you a limited,
                non-exclusive, non-transferable, revocable right to use the
                platform for its intended purpose in accordance with these
                Terms.
              </p>
              <p className="mb-6">
                You retain ownership of content and materials you upload, but
                you grant us a non-exclusive licence to host, use, reproduce
                and display that content as reasonably necessary to operate,
                secure, moderate and improve the platform and to comply with
                law.
              </p>
            </div>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              11. Service availability and changes
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-6">
                We may update, modify, suspend or discontinue features of the
                platform from time to time. We do not promise uninterrupted or
                error-free availability. We may carry out maintenance, security
                work, fraud prevention, moderation or legal compliance measures
                that affect access to some or all services.
              </p>
            </div>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              12. Consumer cancellation and fairness
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-6">
                If you are a consumer, nothing in these Terms limits rights you
                cannot legally waive under applicable consumer law, including
                the Consumer Rights Act 2015. Any provision of these Terms must
                be interpreted, so far as possible, in a way that is fair,
                transparent and consistent with mandatory law.
              </p>
            </div>
          </section>

          {/* Section 13 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              13. Disclaimers
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-6">
                To the fullest extent permitted by law, the platform and
                listings are provided on an "as is" and "as available" basis.
                TA-DA does not warrant that the platform will always be
                available, secure, error-free, suitable for your purposes or
                that any listing, landlord, tenant or third-party provider will
                meet your expectations or legal requirements.
              </p>
            </div>
          </section>

          {/* Section 14 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              14. Limitation of liability
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-6">
                Nothing in these Terms excludes or limits liability for death
                or personal injury caused by negligence, fraud or fraudulent
                misrepresentation, or any other liability that cannot lawfully
                be excluded or limited.
              </p>

              <p className="mb-4">
                Subject to the paragraph above, and to the fullest extent
                permitted by law, TA-DA will not be liable for:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>
                  acts, omissions, statements or breaches by landlords, tenants,
                  guarantors, property operators or third-party providers;
                </li>
                <li>
                  property condition, defects, legal compliance of a property,
                  tenancy disputes or tenancy performance;
                </li>
                <li>
                  loss of rent, loss of profits, loss of business, loss of
                  opportunity, loss of goodwill or any indirect or consequential
                  loss;
                </li>
                <li>
                  events outside our reasonable control, including internet
                  failures, cyberattacks, force majeure events or actions of
                  public authorities.
                </li>
              </ul>

              <p className="mb-6">
                Subject to mandatory law, TA-DA&rsquo;s total aggregate liability
                arising out of or in connection with the platform or these
                Terms will not exceed the greater of (a) the total amount of
                fees actually paid to TA-DA by the claimant in relation to the
                relevant matter in the 12 months before the claim arose, and
                (b) £1,000.
              </p>
            </div>
          </section>

          {/* Section 15 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              15. Suspension, termination and account closure
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-6">
                We may suspend, restrict or terminate access to the platform,
                remove listings or close accounts if we reasonably believe that
                these Terms have been breached, unlawful or fraudulent activity
                is suspected, information is misleading, a risk to users or the
                platform exists, or we are required to do so by law or a
                competent authority.
              </p>
              <p className="mb-6">
                You may stop using the platform at any time and may request
                account closure. Termination does not affect rights or
                obligations that arose before termination, including fees,
                accrued claims, confidentiality or provisions intended to
                survive.
              </p>
            </div>
          </section>

          {/* Section 16 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              16. Notices and communications
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-6">
                We may send notices and service communications through the
                platform, by email, or by other contact details you have
                provided. You are responsible for keeping your contact details
                up to date. Electronic communications satisfy any legal
                requirement for written notice unless the law requires
                otherwise.
              </p>
            </div>
          </section>

          {/* Section 17 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              17. Changes to these Terms
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-6">
                We may update these Terms from time to time. Where a change is
                material, we will take reasonable steps to notify users before
                or when the change takes effect, such as by platform notice or
                email. Continued use after the effective date will mean you
                accept the revised Terms. If you do not agree, you should stop
                using the platform and close your account.
              </p>
            </div>
          </section>

          {/* Section 18 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              18. General
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>
                  These Terms constitute the entire agreement between you and
                  TA-DA regarding platform use, except for any separate written
                  agreement that expressly supplements them;
                </li>
                <li>
                  if any provision is held invalid or unenforceable, the
                  remaining provisions remain in effect to the fullest extent
                  permitted by law;
                </li>
                <li>failure to enforce a provision is not a waiver of rights;</li>
                <li>
                  you may not assign your rights or obligations without our
                  prior written consent. We may assign or transfer our rights
                  and obligations as part of a business transfer,
                  reorganisation or financing arrangement;
                </li>
                <li>
                  no third party has rights under the Contracts (Rights of
                  Third Parties) Act 1999 to enforce these Terms, except where
                  mandatory law gives such rights.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 19 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              19. Governing law and disputes
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-6">
                These Terms are governed by the laws of England and Wales,
                except where mandatory consumer-protection law in your place of
                residence applies. The courts of England and Wales will have
                jurisdiction over disputes arising out of these Terms, save that
                a consumer may also bring proceedings in any court that
                mandatory law permits.
              </p>
              <p className="mb-6">
                Before starting formal proceedings, the parties should first try
                in good faith to resolve the issue through discussion and
                ordinary complaint handling, where that is reasonably possible.
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default TermsOfUsePage;