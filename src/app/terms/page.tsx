
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Kaelix",
  description: "Read the terms governing your use of Kaelix.",
};

const sections = [
  {
    title: "1. About Kaelix",
    paragraphs: [
      "Kaelix provides Discord community management, engagement, gamification, automation, and related website services.",
      "Features may include interactive games, quizzes, challenges, events, points, achievements, rewards, leaderboards, onboarding, factions, notifications, administration tools, analytics, dashboards, and optional premium services.",
      "Individual features may vary depending on development stage, server configuration, and applicable subscription plans.",
    ],
  },
  {
    title: "2. Eligibility",
    paragraphs: [
      "Users must meet Discord's applicable minimum-age requirements and comply with relevant laws.",
      "Use of Kaelix must also comply with Discord's Terms of Service, Community Guidelines, and applicable platform policies.",
      "Anyone installing or configuring Kaelix on behalf of a Discord server must have the necessary permissions.",
    ],
  },
  {
    title: "3. Server Administration and Responsibilities",
    paragraphs: [
      "Discord server owners and administrators are responsible for authorising Kaelix's installation, reviewing permissions, configuring features appropriately, managing their communities, and complying with applicable laws and Discord policies.",
      "Kaelix provides community management tools but does not assume responsibility for independent decisions made by server administrators.",
    ],
  },
  {
    title: "4. Acceptable Use",
    intro: "Users agree not to:",
    items: [
      "Use Kaelix for illegal, fraudulent, abusive, or harmful purposes.",
      "Exploit bugs, vulnerabilities, or security weaknesses.",
      "Manipulate points, rankings, rewards, or achievements through unauthorised methods.",
      "Interfere with the operation or security of the service.",
      "Attempt unauthorised access to accounts, systems, or information.",
      "Distribute malicious content, spam, or prohibited material.",
      "Submit content that infringes intellectual property rights or violates applicable laws.",
      "Circumvent access restrictions or abuse premium functionality.",
    ],
    closing:
      "We may investigate suspected misuse and restrict access where reasonably necessary to protect Kaelix, its users, or its infrastructure.",
  },
  {
    title: "5. User-Generated Content",
    paragraphs: [
      "Some features allow users to submit answers, captions, profile information, quiz responses, and other content.",
      "Users remain responsible for their submissions and retain any ownership rights they hold.",
      "By submitting content, users grant Kaelix a non-exclusive licence to process, store, reproduce, display, and transmit that content as reasonably necessary to provide the relevant functionality.",
      "Users must not submit content they do not have the right to use.",
    ],
  },
  {
    title: "6. Virtual Points, Achievements and Rewards",
    intro: "Unless explicitly stated otherwise:",
    items: [
      "Virtual points have no monetary value.",
      "Points and achievements cannot be exchanged for cash.",
      "Virtual rewards do not represent ownership of financial assets.",
      "Points and achievements are not transferable outside supported functionality.",
      "Gameplay mechanics and reward systems may change during development.",
    ],
    closing:
      "We may adjust or reset virtual rewards where reasonably necessary to correct errors, address abuse, maintain fairness, or support significant feature changes.",
  },
  {
    title: "7. Early Development, Beta Testing and Ongoing Changes",
    paragraphs: [
      "Kaelix is currently in an early stage of active development and beta testing. It is not a finished product.",
      "Features, commands, games, integrations, and interfaces may be introduced, redesigned, modified, restricted, or removed. Certain features may be experimental, incomplete, or temporarily unavailable.",
      "Bugs, unexpected behaviour, interruptions, and technical errors may occur. Updates may affect configurations, gameplay mechanics, points, achievements, and rankings.",
      "Technical infrastructure, databases, and internal systems may be modified or replaced. Maintenance, testing, and service resets may be necessary, subject to applicable legal obligations.",
      "Free and premium features may evolve as Kaelix approaches official release.",
      "Participation in beta testing does not guarantee that any particular feature, reward, configuration, or functionality will remain unchanged or permanently available.",
      "We aim to communicate significant changes where reasonably practical, particularly those affecting purchased services, personal information, or important functionality.",
      "Nothing in this section limits rights or protections that cannot lawfully be excluded.",
    ],
  },
  {
    title: "8. Service Availability and Maintenance",
    paragraphs: [
      'Kaelix is provided on an evolving, "as available" basis.',
      "We aim to maintain reliable functionality but cannot guarantee uninterrupted access, complete availability, or error-free operation.",
      "Maintenance, updates, hosting interruptions, Discord platform changes, and technical failures may affect the service.",
      "We may temporarily suspend features where necessary for security, stability, maintenance, or development.",
    ],
  },
  {
    title: "9. Premium Features, Subscriptions and Payments",
    paragraphs: [
      "Kaelix may introduce optional paid subscriptions, premium features, add-ons, or other commercial offerings.",
      "Where available, prices, billing periods, included features, and purchasing conditions will be displayed before payment.",
      "Purchases processed through Discord are subject to applicable Discord purchasing, subscription, and refund terms.",
      "If other payment methods are introduced, relevant terms will be presented at checkout.",
      "Premium offerings may evolve during development. Material changes affecting active paid subscriptions will be handled in accordance with applicable law and relevant platform requirements.",
      "Nothing in these Terms excludes mandatory consumer protections, including applicable refund and cancellation rights.",
    ],
  },
  {
    title: "10. Intellectual Property",
    paragraphs: [
      "The Kaelix name, branding, original software, designs, documentation, and proprietary materials belong to their respective rights holders.",
      "Users are granted permission to access and use Kaelix in accordance with these Terms.",
      "These Terms do not transfer ownership of Kaelix intellectual property.",
      "Users may not reproduce, redistribute, or commercially exploit proprietary Kaelix materials without permission, except where permitted by applicable law.",
    ],
  },
  {
    title: "11. Suspension and Termination",
    paragraphs: [
      "We may suspend, restrict, or terminate access where reasonably necessary due to serious or repeated violations of these Terms, security concerns, fraud, abuse, legal requirements, or misuse threatening the service or other users.",
      "Server administrators may remove Kaelix from their Discord servers at any time.",
      "Removing the bot does not necessarily result in immediate deletion of stored information. Data requests can be submitted in accordance with our Privacy Policy.",
    ],
  },
  {
    title: "12. Disclaimers and Limitations of Liability",
    paragraphs: [
      "Kaelix is an evolving service, and some functionality remains experimental.",
      "To the extent permitted by applicable law, we do not guarantee that the service will always be available, uninterrupted, secure, or free from defects.",
      "We are not responsible for failures caused by third-party platforms, unauthorised misuse, or circumstances outside our reasonable control, except where liability cannot lawfully be excluded.",
      "Nothing in these Terms excludes or limits liability for fraud, fraudulent misrepresentation, death or personal injury caused by negligence, or any other liability that cannot lawfully be excluded.",
      "Nothing in these Terms limits mandatory consumer rights.",
    ],
  },
  {
    title: "13. Privacy and Data Protection",
    paragraphs: [
      "Information collected through Kaelix is handled in accordance with our Privacy Policy at https://joinkaelix.com/privacy.",
      "Users and administrators should review that policy to understand how information is collected, processed, and retained.",
    ],
  },
  {
    title: "14. Changes to These Terms",
    paragraphs: [
      "Kaelix is expected to undergo frequent updates and changes during its early-development phase.",
      "We may revise these Terms to reflect new functionality, subscription offerings, technical developments, security requirements, or changes in applicable laws and platform policies.",
      "Updated Terms will be published on this page with a revised date.",
      "Where required by law, we will provide additional notice or obtain agreement before changes take effect.",
    ],
  },
  {
    title: "15. Governing Law",
    paragraphs: [
      "These Terms are governed by the laws of England and Wales, subject to applicable mandatory consumer protections and jurisdictional rights in other locations.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#080b14] px-6 py-16 text-slate-200">
      <article className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="mb-10 inline-block text-sm text-violet-400 hover:text-violet-300"
        >
          ← Back to Kaelix
        </Link>

        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-400">
          Legal
        </p>

        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          Terms of Service
        </h1>

        <p className="mt-4 text-sm text-slate-400">
          Last updated: 24 October 2026
        </p>

        <div className="mt-10 rounded-xl border border-violet-500/30 bg-violet-500/10 p-6">
          <h2 className="text-lg font-semibold text-white">
            Early Access / Beta Notice
          </h2>
          <p className="mt-3 leading-7 text-slate-300">
            Kaelix is currently an early-stage project undergoing active
            development and beta testing. It is not a finished commercial
            product. Features, commands, games, integrations, pricing
            structures, availability, and technical systems may change as
            development continues.
          </p>
        </div>

        <p className="mt-10 leading-7 text-slate-300">
          By accessing or using Kaelix, you agree to these Terms of Service
          (&quot;Terms&quot;).
        </p>

        <div className="mt-12 space-y-12">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-4 text-2xl font-semibold text-white">
                {section.title}
              </h2>

              <div className="space-y-4 leading-7 text-slate-300">
                {section.intro && <p>{section.intro}</p>}

                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}

                {section.items && (
                  <ul className="list-disc space-y-2 pl-6">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}

                {section.closing && <p>{section.closing}</p>}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-12 border-t border-white/10 pt-10">
          <h2 className="mb-4 text-2xl font-semibold text-white">
            16. Contact
          </h2>

          <p className="leading-7 text-slate-300">
            For questions, support enquiries, or matters relating to these
            Terms, contact{" "}
            <a
              href="mailto:hello@joinkaelix.com"
              className="text-violet-400 hover:underline"
            >
              hello@joinkaelix.com
            </a>
            .
          </p>

          <p className="mt-2 text-slate-300">
            Website:{" "}
            <a
              href="https://joinkaelix.com"
              className="text-violet-400 hover:underline"
            >
              joinkaelix.com
            </a>
          </p>
        </section>
      </article>
    </main>
  );
}
