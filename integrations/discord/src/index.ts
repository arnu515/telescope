import { serve } from "https://deno.land/std@0.127.0/http/server.ts";
import { customAlphabet } from "https://cdn.skypack.dev/nanoid";
import { except, i } from "./lib/invariant.ts";
import slash from "./lib/slash.ts";
import telescope, { TelescopeError } from "./lib/telescope.ts";

// deno-lint-ignore no-explicit-any
function json(data: any, init?: ResponseInit) {
  console.log(data);
  if (!init) init = { headers: { "content-type": "application/json" } };
  else {
    init = {
      ...init,
      headers: { ...init.headers, "content-type": "application/json" },
    };
  }
  return new Response(JSON.stringify(data), init);
}

const discordInteractionHandler = async (req: Request) => {
  if (req.method.toLowerCase() !== "post") {
    return json({
      error: "Method not allowed",
      error_description: "Please send a POST request",
    }, { status: 405 });
  }

  const rawBody = await req.text();

  const err1 = await except(async () => {
    i(
      typeof req.headers.get("x-signature-ed25519") === "string",
      '"x-signature-ed25519" header required',
    );
    i(
      typeof req.headers.get("x-signature-timestamp") === "string",
      '"x-signature-timestamp" header required',
    );
    i(
      req.headers.get("content-type") === "application/json",
      "Request body must be JSON",
    );
    // validate signature
    i(
      await slash.verifySignature(
        req.headers.get("x-signature-ed25519")!,
        req.headers.get("x-signature-timestamp")!,
        rawBody,
      ),
      "Invalid signature",
    );
  });

  if (err1) {
    return json({ error: "Invalid request", error_description: err1 }, {
      status: 422,
    });
  }

  const body = JSON.parse(rawBody);

  if (body.type === 1) {
    return json({ type: 1 });
  }

  if (body.type === 2) {
    switch (body.data.name) {
      case "call":
        return await callCommand(body);
      default:
        return json({
          type: 4,
          data: {
            content: "This command has not been implemented yet.",
          },
        });
    }
  }

  return new Response(
    JSON.stringify({
      error: "Invalid request",
      error_description: "Invalid request",
    }),
    {
      status: 400,
    },
  );
};

// deno-lint-ignore no-explicit-any
const callCommand = async (body: Record<string, any>) => {
  const fromId = body.member.user.id;
  const toId = body.data.options[0].value;
  console.log({ fromId, toId });

  const err1 = await except(() => {
    i(typeof fromId === "string", "Invalid request");
    i(typeof toId === "string", "Invalid request");
    i(fromId !== toId, "You can't call yourself");
  });

  if (err1) {
    return json({
      type: 4,
      data: {
        content: `**Invalid request**: ${err1}`,
      },
    });
  }

  try {
    const call = await telescope.createCall({
      fromId,
      toId,
      data: {},
    });
    return json({
      type: 4,
      data: {
        embeds: [
          {
            title: "Call placed",
            description:
              `The call has been placed between <@${fromId}> and <@${toId}>`,
            url: "https://telescope.ml/calls/" + call.id,
            fields: [
              {
                name: "Call URL",
                value: "https://telescope.ml/calls/" + call.id,
                inline: true,
              },
            ],
            footer: {
              text:
                "This call will end itself if there is no activity in 15 minutes.",
            },
          },
        ],
      },
    });
  } catch (e) {
    const error: TelescopeError = e;
    return json({
      type: 4,
      data: {
        embeds: [
          {
            title: "An error occured",
            description: error.message,
            fields: [
              {
                name: "Error",
                value: error.body.error,
                inline: true,
              },
              {
                name: "Error Description",
                value: error.body.error_description,
                inline: true,
              },
            ],
          },
        ],
      },
    });
  }
};

const generateState = customAlphabet("0123456789abcdef", 16);
const states: string[] = [];

const authHandler = async (req: Request) => {
  if (req.method !== "GET") {
    return json({
      error: "Method not allowed",
      error_description: "Please send a GET request",
    }, { status: 405 });
  }

  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const callId = url.searchParams.get("call_id");
  const err1 = await except(
    () => {
      if (typeof key === "string") {
        i(key === telescope.opts.key, "Invalid key");
        i(typeof callId === "string", "call_id not present in query string");
      }
      if (typeof code === "string") {
        i(typeof state === "string", "state not present in query string");
        i(!!states.find((i) => i === state), "Invalid state");
        i(state!.split("-").length === 2, "Invalid state");
      }
    },
  );

  if (err1) {
    return json({
      error: "Invalid request",
      error_description: err1,
    }, { status: 422 });
  }

  if (typeof key === "string") {
    // need to redirect to discord for OAuth
    let call;
    try {
      call = await telescope.getCall(callId!);
    } catch (e) {
      console.log(e, e.body);
      return json(e.body, { status: e.status });
    }

    const state = call.id + "-" + generateState();
    states.push(state);

    return new Response(undefined, {
      headers: {
        location: `https://discord.com/api/oauth2/authorize?client_id=${
          encodeURIComponent(Deno.env.get("DISCORD_CLIENT_ID")!)
        }&redirect_uri=${
          encodeURIComponent(Deno.env.get("DISCORD_REDIRECT_URL")!)
        }&state=${encodeURIComponent(state)}&response_type=code&scope=identify`,
      },
      status: 302,
    });
  } else if (typeof code === "string") {
    // back from discord
    const callId = state!.split("-")[0];
    let call;
    try {
      call = await telescope.getCall(callId);
    } catch (e) {
      console.log(e, e.body);
      return json(e.body, { status: e.status });
    }
    states.splice(states.indexOf(state!), 1);

    // deno-lint-ignore no-inner-declarations
    async function forwardError(
      data: { error: string; error_description: string },
    ) {
      const url = await telescope.getForwardErrorUrl(callId, data);
      console.log(url);
      return new Response(undefined, {
        headers: {
          location: url,
        },
        status: 302,
      });
    }

    const body = new URLSearchParams({
      client_id: Deno.env.get("DISCORD_CLIENT_ID")!,
      client_secret: Deno.env.get("DISCORD_CLIENT_SECRET")!,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: Deno.env.get("DISCORD_REDIRECT_URL")!,
    });
    const tokenRes = await fetch("https://discord.com/api/v9/oauth2/token", {
      method: "POST",
      body,
    });
    const tokenData = await tokenRes.json();
    if (tokenRes.status !== 200) {
      return forwardError({
        error: "Authentication failed",
        error_description: "Failed to get token",
      });
    }
    const { access_token, scope } = tokenData;
    console.log(scope);
    if (!scope.includes("identify")) {
      return forwardError({
        error: "Invalid scope",
        error_description:
          "This request has been tampered with. Please try again",
      });
    }
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    const userData = await userRes.json();
    if (userRes.status !== 200) {
      console.error(userData);
      return forwardError({
        error: "Authentication failed",
        error_description: "Failed to get user info",
      });
    }
    const discordUser = userData;
    await fetch("https://discord.com/api/oauth/token/revoke", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    if (call.toId !== discordUser.id && call.fromId !== discordUser.id) {
      return forwardError({
        error: "Authentication failed",
        error_description: "You are not allowed to access this call",
      });
    }

    const authUrl = await telescope.getAuthUrl(call.id, {
      nickname: discordUser.username,
      avatarUrl: discordUser.avatar
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/${
          discordUser.discriminator % 5
        }.png`,
    });

    return new Response(undefined, {
      headers: {
        location: authUrl,
      },
      status: 302,
    });
  } else {
    return json({
      error: "Invalid request",
      error_description: "Invalid request",
    }, { status: 422 });
  }
};

const port = parseInt(Deno.env.get("PORT") || "8000");
console.log("Starting server on port: " + port);
serve(async (req) => {
  // console.log(req);
  const time = Date.now();
  const url = new URL(req.url);
  let res;
  if (url.pathname === "/interaction") {
    res = await discordInteractionHandler(req);
  } else if (url.pathname === "/") {
    res = json({ message: "Pong" });
  } else if (url.pathname === "/auth") {
    res = await authHandler(req);
  } else if (url.pathname === "/add") {
    res = new Response(undefined, {
      headers: {
        location: `https://discord.com/api/oauth2/authorize?client_id=${
          Deno.env.get("DISCORD_CLIENT_ID")
        }&scope=applications.commands`,
      },
      status: 302,
    });
  } else {
    res = json({ error: "Not found", error_description: "Route not found" }, {
      status: 404,
    });
  }
  // console.log(res);
  console.log("Time taken: " + (Date.now() - time));
  return res;
}, {
  port,
  onError: (err) => {
    console.log(err);
    if (err instanceof TelescopeError) {
      return json(err.body, { status: err.status });
    } else {
      return json({
        error: "An error occured",
        error_description: (err as Error).message,
      }, { status: 500 });
    }
  },
});
