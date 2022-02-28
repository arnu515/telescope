import DiscordInteractions from "https://deno.land/x/discord_slash_commands@1.0.6/mod.ts";
import { ApplicationCommandOptionType } from "https://deno.land/x/discord_slash_commands@1.0.6/src/structures/index.ts";

export { ApplicationCommandOptionType };

const config = {
  applicationId: Deno.env.get("DISCORD_APP_ID")!,
  authToken: Deno.env.get("DISCORD_TOKEN")!,
  publicKey: Deno.env.get("DISCORD_PUBLIC_KEY")!,
  tokenPrefix: "Bot",
};

const slash = new DiscordInteractions(config);

export default slash;
