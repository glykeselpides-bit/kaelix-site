
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Kaelix",
  description: "Learn how Kaelix collects, uses, and protects information.",
};

const sections = [
  {
    title: "1. Information We Collect",
    paragraphs: [
      "Depending on the features used, Kaelix may collect and process the following information:",
    ],
    items: [
      "Discord information: user IDs, server IDs, channel IDs, role IDs, message identifiers, and information provided through Discord authentication.",
      "Community activity: game participation, quiz answers, scores, points, achievements, leaderboards, timestamps, and activity statistics.",
      "User-provided information: optional age, birthday, personality preferences, biography, onboarding responses, captions, and other submissions.",
      "Website and administration information: Discord OAuth account information, server configurations, dashboard activity, and administrative action records.",
      "Technical information: error records, operational logs, and security-related events.",
      "Subscription information: for servers on a paid plan or free trial, the plan, its status, and its start, renewal and end dates. For purchases made through Discord, this includes the purchase record Discord sends us (purchase ID, server ID, the Discord user ID of the purchaser, and the plan purchased).",
    ],
    closing:
      "Certain interactive features may process message content or user submissions. Where necessary for a feature, submitted content may also be stored.",
  },
  {
    title: "2. How We Use Information",
    items: [
      "Operate and maintain the Discord bot and website.",
      "Provide games, rankings, achievements, and community features.",
      "Manage onboarding, server settings, and administrative tools.",
      "Provide analytics, notifications, and reminders.",
      "Authenticate users and manage dashboard access.",
      "Prevent misuse, investigate errors, and maintain security.",
      "Respond to support and privacy requests.",
      "Administer premium access where applicable.",
      "Develop, test, and improve Kaelix.",
    ],
    closing:
      "We aim to limit the information processed to what is reasonably necessary for these purposes.",
  },
  {
    title: "3. Legal Bases for Processing",
    paragraphs: [
      "Where UK or European data protection laws apply, we rely on an appropriate legal basis for each processing activity. Depending on the circumstances, this may include contractual necessity, legitimate interests, consent, or compliance with legal obligations.",
      "The applicable legal basis depends on the information involved and the purpose for which it is processed.",
    ],
  },
  {
    title: "4. Data Storage and Service Providers",
    paragraphs: [
      "Kaelix uses third-party infrastructure and service providers, including Discord, Railway, Vercel, and associated database or hosting services.",
      "These providers may process information as necessary to support the operation of Kaelix.",
      "Information may be processed or stored outside the United Kingdom or European Economic Area. Where legally required, appropriate safeguards must apply to international transfers.",
      "Purchases made through Discord are processed by Discord. We do not receive or store card numbers or other payment details.",
      "We do not sell personal information.",
    ],
  },
  {
    title: "5. Data Sharing and Visibility",
    paragraphs: [
      "Information may be accessible to service providers, relevant Discord server administrators, and community members through features such as leaderboards, profiles, and game submissions.",
      "Information may also be disclosed where required by applicable law.",
      "Visibility depends on the feature, server configuration, and relevant permissions.",
    ],
  },
  {
    title: "6. Data Retention",
    paragraphs: [
      "Kaelix retains information for as long as reasonably necessary for the purposes for which it was collected, including service operation, security, and applicable legal obligations.",
      "Retention periods may vary by data category and feature. As Kaelix develops, retention and deletion procedures may be refined or automated.",
      "Removing Kaelix from a Discord server does not necessarily result in immediate deletion of previously stored information.",
      "Users and server administrators may contact us to request deletion or enquire about retained information.",
    ],
  },
  {
    title: "7. Data Security",
    paragraphs: [
      "We use reasonable technical and organisational measures intended to protect information against unauthorised access, disclosure, alteration, and loss.",
      "Security measures may be reviewed and improved as development progresses. No online service can guarantee complete security.",
      "Users should avoid submitting unnecessary sensitive information through interactive features.",
    ],
  },
  {
    title: "8. Your Rights and Data Requests",
    paragraphs: [
      "Depending on applicable law, you may have rights to access, correct, delete, restrict, or object to the processing of your personal information, request data portability, and withdraw consent where processing relies on consent.",
      "To submit a request, email hello@joinkaelix.com and include your Discord user ID and relevant server information where possible. Do not send passwords or authentication tokens.",
      "We may need to verify your identity before responding. Requests will be assessed and handled in accordance with applicable legal requirements.",
      "You may also have the right to complain to the UK Information Commissioner's Office or another competent data protection authority.",
    ],
  },
  {
    title: "9. Children and Age Requirements",
    paragraphs: [
      "Kaelix is intended for individuals who meet Discord's applicable minimum-age requirements.",
      "Certain optional features may allow users to provide age or birthday information. Users should avoid providing personal information unnecessary for the features they use.",
      "Server administrators are responsible for configuring community features appropriately.",
    ],
  },
  {
    title: "10. Third-Party Services",
    paragraphs: [
      "Kaelix operates in connection with Discord and may integrate with other third-party services.",
      "These services maintain their own terms and privacy policies. Kaelix is not responsible for their independent privacy practices.",
    ],
  },
  {
    title: "11. Early Development and Evolving Data Practices",
    paragraphs: [
      "Kaelix is currently in an early stage of active development and beta testing. It is not a finished product.",
      "As the service develops, features, databases, infrastructure, data-processing activities, privacy controls, security measures, and retention procedures may change.",
      "We will update this Privacy Policy to reflect material changes to how personal information is processed and provide additional notice or obtain consent where required by applicable law.",
      "Kaelix's beta status does not reduce its responsibilities under applicable data protection laws.",
    ],
  },
  {
    title: "12. Changes to This Privacy Policy",
    paragraphs: [
      "We may revise this Privacy Policy to reflect changes in features, infrastructure, operating practices, or legal requirements.",
      "Updated versions will be published on this page with a revised date. Additional notice will be provided where legally required.",
    ],
  },
];

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>

        <p className="mt-4 text-sm text-slate-400">
          Last updated: 28 October 2026
        </p>

        <div className="mt-10 rounded-xl border border-violet-500/30 bg-violet-500/10 p-6">
          <h2 className="text-lg font-semibold text-white">
            Early Access / Beta Notice
          </h2>
          <p className="mt-3 leading-7 text-slate-300">
            Kaelix is an early-stage service undergoing active development and
            beta testing. Its features, technical infrastructure, functionality,
            and data practices may evolve as development progresses. This
            Privacy Policy will be reviewed and updated as the service grows.
          </p>
        </div>

        <div className="mt-10 space-y-5 leading-7 text-slate-300">
          <p>
            Kaelix (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;)
            provides Discord community management, engagement, gamification,
            and related website services through the Kaelix Discord bot and
            joinkaelix.com.
          </p>
          <p>
            This Privacy Policy explains what information we collect, why we
            process it, how it may be shared, and the rights available to
            individuals.
          </p>
        </div>

        <div className="mt-12 space-y-12">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-4 text-2xl font-semibold text-white">
                {section.title}
              </h2>

              <div className="space-y-4 leading-7 text-slate-300">
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
            13. Contact
          </h2>
          <p className="leading-7 text-slate-300">
            For privacy enquiries or requests, contact{" "}
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
