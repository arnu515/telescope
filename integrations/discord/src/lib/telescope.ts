import Telescope from "https://raw.githubusercontent.com/arnu515/telescope/calls-and-integrations/integrations/sdk-deno/mod.ts";
export { TelescopeError } from "https://raw.githubusercontent.com/arnu515/telescope/calls-and-integrations/integrations/sdk-deno/src/index.ts";

const telescope = new Telescope({
  clientId: Deno.env.get("TELESCOPE_CLIENT_ID")!,
  clientSecret: Deno.env.get("TELESCOPE_CLIENT_SECRET")!,
  key: Deno.env.get("TELESCOPE_INTEGRATION_KEY")!,
  integrationId: Deno.env.get("TELESCOPE_INTEGRATION_ID")!,
  baseUrl: Deno.env.get("TELESCOPE_BASE_URL"),
});

export default telescope;
