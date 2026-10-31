"use client";

import { useState } from "react";
import { DiscordChannelSelect, useDiscordChannels } from "@/components/DiscordResourceSelects";
import { Field, Panel, SaveButton, Toggle, inputClass, useDashboardRequest } from "@/components/DashboardForm";
import { ErrorNotice, SuccessNotice } from "@/components/ServerReadOnlySection";

export type WelcomeSettings = {
  welcome_enabled: boolean;
  welcome_channel_id: string;
  welcome_message: string;
  welcome_card: boolean;
  leave_enabled: boolean;
  leave_channel_id: string;
  leave_message: string;
  leave_card: boolean;
};

const VARIABLES = "{user} mentions them · {username} their name · {server} the server name · {count} member count";

function preview(text: string, leaving: boolean) {
  return text
    .replaceAll("{user}", leaving ? "Alex" : "@Alex")
    .replaceAll("{username}", "Alex")
    .replaceAll("{server}", "Your Server")
    .replaceAll("{count}", "1,234")
    .replaceAll("**", "");
}

export default function WelcomeForm({ guildId, initial, cardsAllowed, cardsPlan }: {
  guildId: string;
  initial: WelcomeSettings;
  cardsAllowed: boolean;
  cardsPlan: string;
}) {
  const [settings, setSettings] = useState(initial);
  const channelsState = useDiscordChannels(guildId);
  const { saving, error, success, send } = useDashboardRequest(guildId);

  function set<K extends keyof WelcomeSettings>(key: K, value: WelcomeSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    const data = await send<{ settings: WelcomeSettings }>("welcome", "PATCH", settings, "Saved. Kaelix uses the new settings for the next member who joins or leaves.");
    if (data) setSettings(data.settings);
  }

  const sides = [
    { side: "welcome" as const, title: "Welcome messages", when: "when someone joins" },
    { side: "leave" as const, title: "Goodbye messages", when: "when someone leaves" },
  ];

  return (
    <div className="space-y-6">
      {error ? <ErrorNotice>{error}</ErrorNotice> : null}
      {success ? <SuccessNotice>{success}</SuccessNotice> : null}

      <div className="grid gap-5 xl:grid-cols-2">
        {sides.map(({ side, title, when }) => {
          const enabled = settings[`${side}_enabled`];
          const message = settings[`${side}_message`];
          const card = settings[`${side}_card`];
          return (
            <Panel key={side} title={title}>
              <Toggle
                label={`Post a message ${when}`}
                checked={enabled}
                disabled={saving}
                onChange={(value) => set(`${side}_enabled`, value)}
              />

              <DiscordChannelSelect
                guildId={guildId}
                channelsState={channelsState}
                label="Channel"
                value={settings[`${side}_channel_id`]}
                disabled={saving}
                onChange={(value) => set(`${side}_channel_id`, value)}
              />

              <Field label="Message" hint={VARIABLES}>
                <textarea
                  value={message}
                  maxLength={1000}
                  rows={3}
                  disabled={saving}
                  onChange={(event) => set(`${side}_message`, event.target.value)}
                  className={inputClass}
                />
              </Field>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-slate-300">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Preview</span>
                <p className="mt-2 whitespace-pre-wrap">{preview(message, side === "leave")}</p>
              </div>

              <Toggle
                label="Add an image card"
                description={
                  cardsAllowed
                    ? "A card with their avatar and name, with the Kaelix mark in the corner."
                    : `Image cards are included from the ${cardsPlan} plan.${card ? " This one is switched on but only text is sent until you upgrade." : ""}`
                }
                checked={card}
                disabled={saving || (!cardsAllowed && !card)}
                onChange={(value) => set(`${side}_card`, value)}
              />
            </Panel>
          );
        })}
      </div>

      <p className="text-sm text-slate-500">
        Kaelix needs Send Messages and Attach Files in the channels you pick. Test it in Discord with /welcome test.
      </p>

      <SaveButton saving={saving} onClick={save} />
    </div>
  );
}
