import { serve } from "https://deno.land/std@0.127.0/http/server.ts";
import { except, i } from "./lib/invariant.ts";
import slash from "./lib/slash.ts";

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

  const { type = 0, data = { options: [] } } = JSON.parse(rawBody);

  if (type === 1) {
    return json({ type: 1 });
  }

  if (type === 2) {
    console.log({ type, data });
    return json({ type: 4, data: { content: "Pong" } });
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

console.log("Starting server on port: 8000");
serve(async (req) => {
  console.log(req);
  const time = Date.now();
  const res = await handler(req);
  console.log(res);
  console.log("Time taken: " + (Date.now() - time));
  return res;
});
