"use client";

import React from "react";
import Footer from "../components/Footer";
import Link from "next/link";

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 z-50 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center">
              <img src="/black-logo.svg" alt="TADA Logo" className="h-8 sm:h-10" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Privacy Policy</h1>

          <p className="text-gray-700 leading-relaxed mb-6">
            TA-DA.ME LTD | Company number 16647779 | Registered office: 23
            Alphabet Mews, London, England, SW9 0FN | Last updated: 24 March 2026
          </p>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed mb-6">
              This Privacy Policy explains how TA-DA.ME LTD ("TA-DA", "we", "us",
              "our") collects, uses, stores, shares and protects personal data
              when people use our website, mobile or web platform and related
              rental-introduction services in the United Kingdom.
            </p>

            <p className="text-gray-700 leading-relaxed mb-8">
              This Policy is written to support compliance with the UK GDPR, the
              Data Protection Act 2018 and the Privacy and Electronic
              Communications Regulations 2003 (as amended).
            </p>
          </div>
        </div>

        {/* Privacy Sections */}
        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Who we are</h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-6">
                TA-DA.ME LTD is a private limited company incorporated in England
                and Wales under company number 16647779, with registered office at
                23 Alphabet Mews, London, England, SW9 0FN.
              </p>
              <p className="mb-6">
                For the personal data described in this Policy, TA-DA generally
                acts as a data controller because we decide why and how that data
                is processed. In some situations, third parties such as payment
                providers, credit reference agencies, deposit-protection schemes
                and utility providers will act as independent controllers for the
                data they process for their own purposes.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              2. Who this Policy applies to
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>people who visit our website or platform;</li>
                <li>
                  prospective tenants, tenants, landlords and property operators;
                </li>
                <li>
                  people who contact us, create an account, complete verification
                  or use our services;
                </li>
                <li>
                  other individuals whose personal data is provided to us in
                  connection with a property enquiry, tenancy process or legal
                  issue.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              3. Categories of personal data we may collect
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                3.1 Identity and contact data
              </h3>
              <p className="mb-6">
                name, date of birth, email address, telephone number, postal
                address and account credentials;
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                3.2 Verification and tenancy data
              </h3>
              <p className="mb-6">
                government-issued ID, proof of address, proof of income,
                employment details, right-to-rent or similar eligibility
                information where relevant, tenancy application data,
                communications, booking details, deposit and tenancy documents;
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                3.3 Landlord and property data
              </h3>
              <p className="mb-6">
                contact details, proof of ownership or authority to let, listing
                details, property-related documents, payment settlement details
                and communications;
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                3.4 Payment and transaction data
              </h3>
              <p className="mb-6">
                payment confirmations, transaction references, payout details,
                invoice information and limited payment metadata. We do not store
                full payment-card details; card processing is handled by payment
                providers such as Stripe;
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                3.5 Credit and fraud-prevention data
              </h3>
              <p className="mb-6">
                credit-reference outputs, affordability indicators, fraud signals,
                sanctions or AML screening results where used, and internal risk
                flags;
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                3.6 Technical and usage data
              </h3>
              <p className="mb-6">
                IP address, device identifiers, browser and operating system
                details, login history, referral source, cookie identifiers and
                platform usage data;
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                3.7 Special category data
              </h3>
              <p className="mb-6">
                We do not intentionally request special category personal data
                unless it is strictly necessary and lawful to do so. Please avoid
                sending health, biometric or other special category data unless we
                ask for it for a specific reason and tell you how it will be used.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              4. Where we get personal data from
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>
                  directly from you when you create an account, complete forms,
                  upload documents or communicate with us;
                </li>
                <li>
                  from landlords, tenants, guarantors or property operators
                  involved in a transaction;
                </li>
                <li>
                  from payment providers, credit reference agencies,
                  identity-verification providers and deposit-protection schemes;
                </li>
                <li>
                  from analytics, cookies, server logs and fraud-prevention tools;
                </li>
                <li>
                  from publicly available sources and regulators where relevant
                  for compliance checks or dispute handling.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              5. Why we process personal data and our lawful bases
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-6">
                We process personal data only where we have a valid lawful basis
                under Article 6 UK GDPR. Depending on the context, more than one
                lawful basis may apply.
              </p>
              <p className="mb-4 font-medium">Purpose/Typical lawful basis</p>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>
                  creating and managing accounts; enabling log-in and platform
                  access - performance of a contract; legitimate interests
                </li>
                <li>
                  matching tenants and landlords; arranging viewings; facilitating
                  introductions and tenancy administration - performance of a
                  contract; legitimate interests
                </li>
                <li>
                  identity checks, fraud prevention, abuse prevention and platform
                  security - legitimate interests; legal obligation where
                  applicable
                </li>
                <li>
                  credit and affordability checks where used in the application
                  flow - performance of a contract; legitimate interests; legal
                  obligation where applicable
                </li>
                <li>
                  processing payments, payouts, invoices, refunds and fee
                  administration - performance of a contract; legal obligation
                </li>
                <li>
                  deposit registration and compliance with housing, accounting,
                  tax and regulatory obligations - legal obligation; performance
                  of a contract
                </li>
                <li>
                  customer support, complaints, disputes and legal claims -
                  legitimate interests; legal obligation; establishment, exercise
                  or defence of legal claims
                </li>
                <li>
                  service analytics, troubleshooting and product improvement -
                  legitimate interests; consent where required for cookies or
                  similar technologies
                </li>
                <li>
                  marketing communications and non-essential tracking - consent,
                  and in some cases legitimate interests where permitted by law
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              6. Credit checks, profiling and decisions
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-6">
                We may use identity-verification, fraud-prevention and
                credit-reference tools provided by third parties, including
                Experian or similar providers. These checks may contribute to risk
                assessment, affordability review or tenancy suitability
                assessment.
              </p>
              <p className="mb-6">
                Where automated tools are used, we aim to ensure that significant
                decisions are not made solely by automated means where Article 22
                UK GDPR would prohibit this. You may ask for human review, express
                your point of view and challenge a decision where those rights
                apply.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              7. Who we share personal data with
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>
                  landlords, tenants, guarantors or property operators where
                  necessary to progress an enquiry, viewing, application or
                  tenancy;
                </li>
                <li>
                  service providers that support hosting, analytics,
                  communications, payments, identity verification, credit checks,
                  customer support and security;
                </li>
                <li>payment providers such as Stripe Payments UK Ltd;</li>
                <li>
                  credit reference and identity verification providers such as
                  Experian or equivalent providers;
                </li>
                <li>
                  deposit-protection schemes and related compliance providers
                  where a deposit is taken;
                </li>
                <li>
                  utility or move-in partners if you ask us to arrange or refer
                  those services;
                </li>
                <li>
                  professional advisers, insurers, auditors, law-enforcement
                  bodies, courts, regulators and public authorities where required
                  or appropriate.
                </li>
              </ul>
              <p className="mb-6">
                Where a third party processes personal data on our behalf as our
                processor, we expect an appropriate written data-processing
                agreement. Where the third party uses the data for its own
                purposes, it will normally be an independent controller and its
                own privacy notice will also apply.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              8. International transfers
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-6">
                Some of our providers may process personal data outside the UK.
                Where that happens, we use transfer safeguards recognised under UK
                data-protection law, such as adequacy regulations, the UK Addendum
                to the EU Standard Contractual Clauses, the UK International Data
                Transfer Agreement or another lawful transfer mechanism, together
                with risk assessment where required.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              10. Security
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-6">
                We use technical and organisational measures designed to protect
                personal data, including encrypted transmission where
                appropriate, access controls, authentication safeguards, logging,
                provider management and incident-response procedures. No system
                can be guaranteed to be completely secure, but we take
                reasonable steps appropriate to the risk.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              11. Your rights
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-6">
                Depending on the circumstances, you may have the following rights
                under UK data-protection law:
              </p>
              <p className="mb-4 font-medium">Right/What it means</p>
              <div className="mb-8">
                <p className="font-semibold text-gray-900 mb-1">Access</p>
                <p className="mb-4">
                  You can ask for a copy of the personal data we hold about you.
                </p>

                <p className="font-semibold text-gray-900 mb-1">Rectification</p>
                <p className="mb-4">
                  You can ask us to correct inaccurate or incomplete data.
                </p>

                <p className="font-semibold text-gray-900 mb-1">Erasure</p>
                <p className="mb-4">
                  You can ask us to delete data in some circumstances.
                </p>

                <p className="font-semibold text-gray-900 mb-1">Restriction</p>
                <p className="mb-4">
                  You can ask us to limit how we use your data in some cases.
                </p>

                <p className="font-semibold text-gray-900 mb-1">Portability</p>
                <p className="mb-4">
                  You can ask for certain data in a reusable format.
                </p>

                <p className="font-semibold text-gray-900 mb-1">Objection</p>
                <p className="mb-4">
                  You can object to processing based on legitimate interests or
                  direct marketing.
                </p>

                <p className="font-semibold text-gray-900 mb-1">Human review</p>
                <p>
                  You can ask for a human review of a decision where Article 22
                  applies.
                </p>
              </div>
              <p className="mb-6">
                You may also withdraw consent at any time where processing
                depends on consent. Withdrawal does not affect the lawfulness of
                processing carried out before withdrawal.
              </p>
              <p className="mb-6">
                To exercise your rights, contact us using the contact details
                published on the platform or write to our registered office. We
                may ask for information to verify your identity before acting on
                a request.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              12. Cookies and similar technologies
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-6">
                We use cookies and similar technologies to operate the platform,
                remember settings, understand usage and improve our services.
                Under PECR, strictly necessary cookies do not require consent,
                but non-essential cookies such as analytics, functionality and
                marketing cookies generally do require consent unless an
                exemption applies.
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>
                  strictly necessary cookies used for core platform functions,
                  security, authentication and network management;
                </li>
                <li>preference or functionality cookies where enabled;</li>
                <li>
                  analytics cookies, including tools such as Google Analytics,
                  only where lawful and configured in line with applicable
                  consent requirements;
                </li>
                <li>
                  marketing or advertising technologies only where you have
                  given the required consent.
                </li>
              </ul>
              <p className="mb-6">
                You can manage non-essential cookies through our cookie banner
                or consent-management settings and can withdraw consent at any
                time.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              13. Children
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-6">
                Our services are intended for adults. We do not knowingly
                provide the platform to children or intentionally collect
                personal data from anyone under 18 in connection with tenancy
                services.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              14. Complaints
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-6">
                We may update this Policy from time to time to reflect legal,
                regulatory, technical or operational changes. The latest version
                will be published on the platform with the updated date shown at
                the top of the document.
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;
