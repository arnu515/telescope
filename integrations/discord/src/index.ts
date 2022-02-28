import { serve } from "https://deno.land/std@0.127.0/http/server.ts";
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

const handler = async (req: Request) => {
  // Request should be post and have correct headers
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
            url: "https://telescope.gq/call/" + call.id,
            fields: [
              {
                name: "Call URL",
                value: "https://telescope.gq/call/" + call.id,
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

console.log("Starting server on port: 8000");
serve(async (req) => {
  // console.log(req);
  const time = Date.now();
  const res = await handler(req);
  // console.log(res);
  console.log("Time taken: " + (Date.now() - time));
  return res;
});
