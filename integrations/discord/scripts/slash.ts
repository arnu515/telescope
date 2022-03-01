import slash, { ApplicationCommandOptionType } from "../src/lib/slash.ts";
import * as c from "https://deno.land/x/nanocolors@0.1.12/mod.ts";
import i from "../src/lib/invariant.ts";

i(
  typeof Deno.env.get("DISCORD_APP_ID") === "string",
  "DISCORD_APP_ID should be present in env",
);
i(
  typeof Deno.env.get("DISCORD_PUBLIC_KEY") === "string",
  "DISCORD_PUBLIC_KEY should be present in env",
);
i(
  typeof Deno.env.get("DISCORD_TOKEN") === "string",
  "DISCORD_TOKEN should be present in env",
);

console.log(c.yellow("Creating slash commands..."));

await slash.createApplicationCommand({
  name: "call",
  description: "Call a user",
  options: [
    {
      name: "target",
      description: "User to call",
      type: ApplicationCommandOptionType.USER,
      required: true,
    },
  ],
}).then((res) => {
  console.log(res);
}).catch((err) => {
  throw err;
});

console.log(c.green("Created slash commands"));

console.log(
  c.white("You can add the bot to your server by visiting this url:"),
);
console.log(
  c.blue(
    `https://discord.com/api/oauth2/authorize?client_id=${
      Deno.env.get("DISCORD_APP_ID")
    }&scope=applications.commands`,
  ),
);
