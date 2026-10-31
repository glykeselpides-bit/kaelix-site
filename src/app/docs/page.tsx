import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BOT_INVITE_URL } from "@/lib/discordStore";

export const metadata: Metadata = {
  title: "Docs | Kaelix",
  description: "Set up Kaelix and learn every feature: activities, factions, moderation, AutoMod, leveling, Autopilot, alerts and more.",
};

type Command = [name: string, what: string];

type DocSection = {
  id: string;
  title: string;
  plan?: string;
  intro: string;
  steps?: string[];
  commands?: Command[];
  tips?: string[];
  dashboard?: string; // the Server Panel page that manages this
};

const sections: DocSection[] = [
  {
    id: "getting-started",
    title: "Getting started",
    intro: "Kaelix takes about five minutes to set up. You need to be a server admin (Manage Server or Administrator).",
    steps: [
      "Add Kaelix to your server with the Add to Discord button.",
      "In Server Settings → Roles, drag the Kaelix role above any roles you want it to give out (faction roles, level rewards, giveaway prizes). Discord only lets a bot give roles that sit below its own.",
      "Run /setup in any channel. The wizard walks you through channels, factions and onboarding.",
      "Use /settings to change things later, or log in to the dashboard on this website and pick your server.",
      "Try a game: /activities opens the Activity Hub, where you can start any game your plan includes.",
    ],
    commands: [
      ["/setup", "The setup wizard."],
      ["/settings", "Kaelix's settings panel, including Plan & Access."],
    ],
    tips: [
      "Slash commands can take a minute to appear after Kaelix joins. If they don't, restart Discord.",
      "Admin commands are hidden from members who don't have the right permission.",
    ],
  },
  {
    id: "plans",
    title: "Plans and buying",
    intro: "Kaelix has four plans: Free, Core, Pro and Elite. A plan covers the whole server, and each plan includes everything in the plans below it.",
    steps: [
      "Run /settings and open Plan & Access, or use the buttons on the pricing page. Payment is handled by Discord.",
      "Only server admins (members with Manage Server) can buy a plan. Members who press an Upgrade button are asked to talk to an admin.",
      "The plan unlocks automatically as soon as Discord confirms the payment.",
    ],
    tips: [
      "After a downgrade nothing is deleted. Features from the higher plan pause and come back if you upgrade again. Where a plan has a limit (like 10 Autopilot schedules), the oldest ones keep working.",
    ],
  },
  {
    id: "members",
    title: "For members",
    intro: "Everything members can do. Points come from chatting, voice, events and games.",
    commands: [
      ["/profile", "Your Kaelix profile."],
      ["/level", "Your level and XP."],
      ["/points · /pointrecords", "Your points and where they came from."],
      ["/leaderboard", "The server's rankings."],
      ["/faction · /factionleaderboard", "Your faction and how the factions stand."],
      ["/initiate", "Take the faction quiz to join a faction."],
      ["/events · /register", "Upcoming events, and signing up for one."],
      ["/activities", "Browse and play games."],
      ["/shop · /buyitem · /inventory · /useitem", "Spend points in the shop (Pro)."],
      ["/notifications", "Choose which DMs Kaelix sends you (Core)."],
    ],
  },
  {
    id: "activities",
    title: "Activities and events",
    intro: "17 games, from quick riddles to multi-hour Meme Wars. Free has 3, Core 7, Pro 12, Elite all of them.",
    commands: [
      ["/activities", "The Activity Hub: start, check or end a game."],
      ["/events · /eventinfo", "List events and see the details of one."],
      ["/attend", "Mark members as attended so they get the event's points."],
      ["/addpoints · /removepoints", "Adjust a member's points by hand."],
    ],
    tips: ["You can choose which games are switched on, and limit them to one channel, on the dashboard's Activities page."],
    dashboard: "Activities",
  },
  {
    id: "moderation",
    title: "Moderation",
    plan: "Free",
    intro: "Every action is saved as a numbered case, and can be posted to a log channel.",
    commands: [
      ["/mod warn", "Warn a member. It's saved to their record."],
      ["/mod timeout · /mod untimeout", "Mute someone for a while, e.g. 10m, 2h, 1d (up to 28 days)."],
      ["/mod kick · /mod ban · /mod unban", "Remove someone. Bans work even if they've left."],
      ["/mod purge", "Delete up to 100 recent messages in a channel."],
      ["/mod warnings · /mod clearwarnings", "A member's active warnings, and clearing them."],
      ["/mod logchannel", "Where moderation and AutoMod actions are posted."],
    ],
    tips: ["Kaelix can't act on members whose highest role is above its own, or on the server owner."],
    dashboard: "AutoMod & Moderation",
  },
  {
    id: "automod",
    title: "AutoMod",
    plan: "Free, more on Core",
    intro: "AutoMod deletes rule-breaking messages and warns the sender. Staff (Manage Messages or Administrator), bots, and exempt roles and channels are never checked.",
    steps: [
      "Free: spam, mass mentions and Discord invite links.",
      "Core and up: banned words, all links, and an automatic timeout after a number of warnings in 24 hours.",
    ],
    commands: [
      ["/automod enable", "Switch AutoMod on or off."],
      ["/automod rule", "Turn one rule on or off."],
      ["/automod mentions", "How many mentions in one message count as mass mentioning."],
      ["/automod words", "Add or remove banned words (Core)."],
      ["/automod escalation", "Auto-timeout after repeated warnings (Core)."],
      ["/automod exempt", "Let a role or channel skip AutoMod."],
      ["/automod view", "See the current rules."],
    ],
    dashboard: "AutoMod & Moderation",
  },
  {
    id: "welcome",
    title: "Welcome and goodbye messages",
    plan: "Free, cards on Core",
    intro: "Greet new members and say goodbye when they leave. On Core and up, add an image card with their avatar.",
    commands: [
      ["/welcome setup", "Turn on welcome messages: channel, message and card."],
      ["/welcome leave", "Turn on goodbye messages."],
      ["/welcome test", "Preview it using yourself."],
      ["/welcome view · /welcome off", "See the settings, or switch one off."],
    ],
    tips: ["Kaelix needs Send Messages and Attach Files in the channel for image cards."],
    dashboard: "Welcome & Goodbye",
  },
  {
    id: "custom-commands",
    title: "Custom commands and auto-responders",
    plan: "Core: 2 each · Pro: unlimited",
    intro: "Custom commands reply when someone types !name. Auto-responders reply when a message contains, starts with or exactly matches a trigger. On Pro, a custom command can also give or take a role.",
    commands: [
      ["/customcommand create · edit · delete · list", "Manage your !commands."],
      ["/autoresponder add · remove · list", "Manage automatic replies."],
    ],
  },
  {
    id: "polls-giveaways",
    title: "Polls and giveaways",
    plan: "Free, more on Core and Pro",
    intro: "Button polls and giveaways. Free has 2 active polls and 1 giveaway; Core adds unlimited polls, multiple choice and 5 giveaways with level or faction rules; Pro adds unlimited giveaways and point entries.",
    commands: [
      ["/poll create · /poll end", "Post a poll, and close it early (its number is in the footer)."],
      ["/giveaway start · end · reroll · list", "Run giveaways. Kaelix picks winners at random and can hand out a role prize."],
    ],
    tips: ["Your server provides giveaway prizes. Kaelix only picks the winners and gives role prizes."],
  },
  {
    id: "leveling",
    title: "Leveling rewards",
    plan: "Pro",
    intro: "Every plan has XP and levels. Pro lets you reward them and tune how XP is earned.",
    commands: [
      ["/leveling reward", "Give a role when members reach a level."],
      ["/leveling sync", "Give reward roles to members who already passed those levels."],
      ["/leveling stack", "Keep every reward role, or only the highest."],
      ["/leveling message", "Your own level-up message and channel."],
      ["/leveling boost", "More or less XP for a role or channel (0 = no XP)."],
      ["/leveling antifarm", "No XP for short or repeated messages, or idle voice."],
      ["/leveling view", "See everything."],
    ],
    dashboard: "Leveling",
  },
  {
    id: "seasons",
    title: "Faction Seasons",
    plan: "Pro",
    intro: "Timed faction wars. Every point earned while a season runs counts for the member's faction. At the end Kaelix announces the winner and MVP, gives the winning faction a reward role, and saves the result to the Hall of Fame.",
    commands: [
      ["/season start", "Start a season, with its length and an optional reward role."],
      ["/season standings · /season end", "Check the race, or end it early."],
      ["/season halloffame", "Every past winner."],
    ],
  },
  {
    id: "autopilot",
    title: "Activity Autopilot",
    plan: "Pro: 10 · Elite: unlimited",
    intro: "Run any game your plan includes on a daily or weekly schedule, in your own time zone, with an optional reminder and role ping. Games start and finish by themselves, even when no staff are online.",
    commands: [
      ["/autopilot add", "Schedule a game."],
      ["/autopilot run", "Run a schedule right now to test it."],
      ["/autopilot list · pause · remove", "Manage schedules."],
      ["/autopilot images add · list · remove", "The image pool Caption This picks from."],
    ],
    tips: ["Caption This needs at least one image in the pool. GIF Battle needs one or more themes, separated by |."],
    dashboard: "Autopilot",
  },
  {
    id: "alerts",
    title: "Stream alerts",
    plan: "Pro: 10 · Elite: unlimited",
    intro: "Post when a Twitch or Kick streamer goes live, or a YouTube channel uploads. Kaelix checks every few minutes.",
    commands: [
      ["/alerts add", "Follow a Twitch or Kick username, or a YouTube @handle or channel link."],
      ["/alerts test", "Post a sample alert."],
      ["/alerts list · /alerts remove", "Manage alerts."],
    ],
    dashboard: "Stream Alerts",
  },
  {
    id: "insights",
    title: "Server insights",
    plan: "Pro",
    intro: "The best times to host, your busiest channels, active members, growth, how many new members stick around, and which games bring people back.",
    commands: [
      ["/insights", "Open the insights report."],
      ["/analytics", "Points, events and faction analytics."],
    ],
    tips: ["Kaelix only counts messages; it never stores what they say. Counts older than 120 days are deleted."],
  },
  {
    id: "elite",
    title: "Elite features",
    plan: "Elite",
    intro: "For large communities and groups of servers.",
    commands: [
      ["/network create · join · leave · info", "Link up with other Elite servers using a join code."],
      ["/network season start · end · standings", "Rank the servers in your network against each other."],
      ["/network cohost add · remove", "Let up to 2 other servers schedule Trivia Nights."],
      ["/trivianight schedule · upcoming · results", "Live trivia played in every server of the network at once."],
      ["/trivianight channel · skip · join", "Each server picks its channel, or sits a night out."],
      ["/tournament start · bracket · cancel", "Knockout brackets between factions or servers."],
      ["/game create · add · play · list", "Build your own trivia-style games."],
      ["/automation create · list · toggle · delete", "When something happens, do up to 5 things automatically."],
      ["/branding name · avatar · banner · bio · hidekaelix", "Change how Kaelix looks in your server."],
    ],
    tips: ["Custom branding must not imitate other bots, brands, Discord or real people. See the Terms of Service."],
  },
];

const variables: Command[] = [
  ["{user}", "Mentions the member"],
  ["{username}", "The member's name"],
  ["{server}", "Your server's name"],
  ["{count}", "Member count"],
  ["{level}", "Level (level-up messages, automations)"],
  ["{faction}", "Faction (automations)"],
  ["{name} {title} {link} {game}", "Stream alerts: channel, stream or video title, link, game"],
];

const faq: [string, string][] = [
  ["Kaelix says it can't give a role.", "Drag the Kaelix role above that role in Server Settings → Roles, and check Kaelix has Manage Roles."],
  ["The slash commands don't show up.", "Wait a minute after adding Kaelix, then restart Discord. Admin commands only show for members with the right permission."],
  ["Welcome cards only send text.", "Image cards need the Core plan, and Kaelix needs Attach Files in that channel."],
  ["I bought a plan but nothing changed.", "Plans unlock as soon as Discord confirms the payment. Run /settings → Plan & Access to check, and make sure it was bought for the right server."],
  ["Do I need the website?", "No. Everything can be done in Discord. The dashboard is an easier way to change settings and see history."],
];

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-200">
      {plan}
    </span>
  );
}

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-black bg-[url('/banner2.png')] bg-cover bg-fixed bg-center text-white">
      <div className="min-h-screen bg-black/80">
        <Navbar />

        <div className="mx-auto max-w-6xl px-6 pb-24 pt-32">
          <header className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.45em] text-blue-300">Docs</p>
            <h1 className="mt-5 text-4xl font-bold md:text-5xl">Everything Kaelix can do, and how to set it up.</h1>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Start with Getting started, then jump to whatever you need. Plan names show where a feature
              needs a paid plan.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={BOT_INVITE_URL} target="_blank" rel="noopener noreferrer" className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500">
                Add to Discord
              </a>
              <Link href="/dashboard" className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-blue-400">
                Open the dashboard
              </Link>
              <Link href="/commands" className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-blue-400">
                All commands
              </Link>
            </div>
          </header>

          <div className="mt-16 gap-10 lg:grid lg:grid-cols-[220px_1fr]">
            <nav aria-label="On this page" className="mb-10 lg:mb-0">
              <div className="rounded-3xl border border-white/10 bg-black/40 p-5 lg:sticky lg:top-28">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">On this page</p>
                <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm lg:grid-cols-1">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a href={`#${section.id}`} className="text-slate-400 transition hover:text-white">{section.title}</a>
                    </li>
                  ))}
                  <li><a href="#variables" className="text-slate-400 transition hover:text-white">Message variables</a></li>
                  <li><a href="#faq" className="text-slate-400 transition hover:text-white">Troubleshooting</a></li>
                </ul>
              </div>
            </nav>

            <div className="min-w-0 space-y-8">
              {sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-28 rounded-3xl border border-white/10 bg-black/50 p-6 backdrop-blur-xl md:p-8">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-bold">{section.title}</h2>
                    {section.plan ? <PlanBadge plan={section.plan} /> : null}
                  </div>
                  <p className="mt-4 leading-7 text-slate-300">{section.intro}</p>

                  {section.steps ? (
                    <ol className="mt-5 list-decimal space-y-2 pl-5 leading-7 text-slate-300 marker:text-blue-300">
                      {section.steps.map((step) => <li key={step}>{step}</li>)}
                    </ol>
                  ) : null}

                  {section.commands ? (
                    <dl className="mt-6 divide-y divide-white/5 rounded-2xl border border-white/10 bg-black/30">
                      {section.commands.map(([name, what]) => (
                        <div key={name} className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(0,260px)_1fr] sm:gap-4">
                          <dt className="break-words font-mono text-sm text-blue-200">{name}</dt>
                          <dd className="text-sm leading-6 text-slate-300">{what}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}

                  {section.tips?.map((tip) => (
                    <p key={tip} className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-slate-400">
                      {tip}
                    </p>
                  ))}

                  {section.dashboard ? (
                    <p className="mt-4 text-sm text-slate-500">
                      Also on the <Link href="/dashboard" className="text-blue-300 underline-offset-4 hover:underline">dashboard</Link>: pick your server, then <span className="text-slate-300">{section.dashboard}</span>.
                    </p>
                  ) : null}
                </section>
              ))}

              <section id="variables" className="scroll-mt-28 rounded-3xl border border-white/10 bg-black/50 p-6 backdrop-blur-xl md:p-8">
                <h2 className="text-2xl font-bold">Message variables</h2>
                <p className="mt-4 leading-7 text-slate-300">Use these in welcome, goodbye, level-up, custom command, automation and alert messages.</p>
                <dl className="mt-6 divide-y divide-white/5 rounded-2xl border border-white/10 bg-black/30">
                  {variables.map(([name, what]) => (
                    <div key={name} className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(0,260px)_1fr] sm:gap-4">
                      <dt className="font-mono text-sm text-blue-200">{name}</dt>
                      <dd className="text-sm text-slate-300">{what}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section id="faq" className="scroll-mt-28 rounded-3xl border border-white/10 bg-black/50 p-6 backdrop-blur-xl md:p-8">
                <h2 className="text-2xl font-bold">Troubleshooting</h2>
                <div className="mt-6 space-y-5">
                  {faq.map(([question, answer]) => (
                    <div key={question}>
                      <h3 className="font-semibold text-white">{question}</h3>
                      <p className="mt-1 leading-7 text-slate-300">{answer}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-8 text-sm text-slate-400">
                  Still stuck? Ask in the{" "}
                  <a href="https://discord.gg/2PYbjwmHRX" target="_blank" rel="noopener noreferrer" className="text-blue-300 underline-offset-4 hover:underline">
                    Kaelix community server
                  </a>
                  .
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
