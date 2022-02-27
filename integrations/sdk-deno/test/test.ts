import Telescope from "../mod.ts";

const telescope = new Telescope({
  clientId: "8-L18orpdxuSBVaI",
  clientSecret:
    "fqITXq8__WSpchTe-8400af9e6c44368238743104b2d4afe6-73b514dbf21d200fab909590c6e998a9ec592e96a4395fe4cd22d8b4defb0d38",
  integrationId: "discord-dev",
  key: "UpncBWGPV25Xhdb_3b1PusApF4_VPV13ke5XJlEvim4Mq2BU54yDPCaJeJP7IYbo",
  baseUrl: "http://b7e7-122-167-224-175.ngrok.io",
});

await telescope.createCall({
  toId: "string",
  fromId: "string",
  data: { test: true },
});
