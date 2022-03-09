import { serve } from "https://deno.land/std@0.127.0/http/server.ts";
import telescope, { TelescopeError } from "./lib/telescope.ts";
import { join } from "https://deno.land/std@0.127.0/path/mod.ts";
import { Md5 } from "https://deno.land/std@0.127.0/hash/md5.ts";
import { renderToString } from "https://deno.land/x/dejs@0.10.2/mod.ts";
import { sendEmail } from "./lib/mail.ts";

async function sendEjs(file: string, data = {}, init?: ResponseInit) {
  const __dirname = new URL(".", import.meta.url).pathname;
  const html = await renderToString(
    new TextDecoder().decode(Deno.readFileSync(join(__dirname, file))),
    data,
  );
  if (!init) init = { headers: { "content-type": "text/html" } };
  else {
    init = {
      ...init,
      headers: { ...init.headers, "content-type": "text/html" },
    };
  }
  return new Response(html, init);
}

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

async function addHandler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return await sendEjs("templates/add.html", {
      from: "",
      to: "",
      error: "Method not allowed",
      success: "",
    }, {
      status: 405,
    });
  }

  if (req.headers.get("content-type") !== "application/x-www-form-urlencoded") {
    return await sendEjs("templates/add.html", {
      from: "",
      to: "",
      error: "Invalid request",
      success: "",
    }, {
      status: 422,
    });
  }

  const body = new URLSearchParams(await req.text());

  function sendError(error: string) {
    return sendEjs(
      "templates/add.html",
      {
        from: body.get("from") || "",
        to: body.get("to") || "",
        error,
        success: "",
      },
    );
  }

  const from = body.get("from");
  const to = body.get("to");

  if (typeof from !== "string" || !from.trim()) {
    return sendError("From email is required");
  }
  if (typeof to !== "string" || !to.trim()) {
    return sendError("To email is required");
  }
  if (!/\S+@\S+\.\S+/.test(from)) {
    return sendError("From email is not a valid email");
  }
  if (!/\S+@\S+\.\S+/.test(to)) {
    return sendError("To email is not a valid email");
  }

  const call = await telescope.createCall({
    toId: to.trim(),
    fromId: from.trim(),
    data: {},
  });

  const fromAuthUrl = await telescope.getAuthUrl(call.id, {
    nickname: from.trim(),
    avatarUrl: `https://gravatar.com/avatar/${
      new Md5().update(from.trim()).toString("hex")
    }?d=mp&s=64`,
  });
  const toAuthUrl = await telescope.getAuthUrl(call.id, {
    nickname: to.trim(),
    avatarUrl: `https://gravatar.com/avatar/${
      new Md5().update(to.trim()).toString("hex")
    }?d=mp&s=64`,
  });
  const __dirname = new URL(".", import.meta.url).pathname;

  await sendEmail({
    email: from.trim(),
    html: await renderToString(
      new TextDecoder().decode(
        Deno.readFileSync(join(__dirname, "templates/meeting-email-from.html")),
      ),
      { to: to.trim(), link: fromAuthUrl },
    ),
    text: await renderToString(
      new TextDecoder().decode(
        Deno.readFileSync(join(__dirname, "templates/meeting-email-from.txt")),
      ),
      { to: to.trim(), link: fromAuthUrl },
    ),
  });
  await sendEmail({
    email: to.trim(),
    html: await renderToString(
      new TextDecoder().decode(
        Deno.readFileSync(join(__dirname, "templates/meeting-email-to.html")),
      ),
      { from: from.trim(), link: toAuthUrl },
    ),
    text: await renderToString(
      new TextDecoder().decode(
        Deno.readFileSync(join(__dirname, "templates/meeting-email-to.txt")),
      ),
      { from: from.trim(), link: toAuthUrl },
    ),
  });

  return sendEjs("templates/add.html", {
    success: "true",
    error: "",
    from: "",
    to: "",
  });
}

async function authHandler(req: Request) {
  if (req.method !== "POST") {
    return await sendEjs("templates/auth.html", {
      to: "",
      error: "Method not allowed",
      success: "",
      call_id: "",
      key: "",
    }, {
      status: 405,
    });
  }

  if (req.headers.get("content-type") !== "application/x-www-form-urlencoded") {
    return await sendEjs("templates/auth.html", {
      to: "",
      error: "Invalid request",
      success: "",
      call_id: "",
      key: "",
    }, {
      status: 422,
    });
  }

  const body = new URLSearchParams(await req.text());

  function sendError(error: string) {
    return sendEjs(
      "templates/auth.html",
      {
        to: body.get("to") || "",
        error,
        success: "",
        call_id: body.get("call_id") || "",
        key: body.get("key") || "",
      },
    );
  }

  const to = body.get("to");
  const call_id = body.get("call_id");
  const key = body.get("key");

  if (typeof to !== "string" || !to.trim()) {
    return sendError("To email is required");
  }
  if (typeof call_id !== "string" || !call_id.trim()) {
    return sendError("call_id is required");
  }
  if (typeof key !== "string" || !key.trim()) {
    return sendError("key is required");
  }
  if (!/\S+@\S+\.\S+/.test(to)) {
    return sendError("To email is not a valid email");
  }
  if (key !== telescope.opts.key) {
    return sendError("Invalid request");
  }

  const call = await telescope.getCall(call_id);

  if (call.toId !== to.trim() && call.fromId !== to.trim()) {
    return sendError("You are not invited to this meeting");
  }

  const toAuthUrl = await telescope.getAuthUrl(call.id, {
    nickname: to.trim(),
    avatarUrl: `https://gravatar.com/avatar/${
      new Md5().update(to.trim()).toString("hex")
    }?d=mp&s=64`,
  });
  const __dirname = new URL(".", import.meta.url).pathname;

  await sendEmail({
    email: to.trim(),
    html: await renderToString(
      new TextDecoder().decode(
        Deno.readFileSync(join(__dirname, "templates/meeting-email-from.html")),
      ),
      { to: to.trim(), link: toAuthUrl },
    ),
    text: await renderToString(
      new TextDecoder().decode(
        Deno.readFileSync(join(__dirname, "templates/meeting-email-from.txt")),
      ),
      { to: to.trim(), link: toAuthUrl },
    ),
  });

  return sendEjs("templates/auth.html", {
    success: "true",
    error: "",
    to: "",
    call_id: body.get("call_id") || "",
    key: body.get("key") || "",
  });
}

const port = parseInt(Deno.env.get("PORT") || "8000");
console.log("Starting server on port: " + port);
serve(async (req) => {
  // console.log(req);
  const time = Date.now();
  const url = new URL(req.url);
  let res;
  if (url.pathname === "/") {
    res = json({ success: true });
  } else if (url.pathname === "/add") {
    if (req.method === "GET") {
      res = await sendEjs("templates/add.html", {
        from: "",
        to: "",
        error: "",
        success: "",
      });
    } else res = await addHandler(req);
  } else if (url.pathname === "/auth") {
    if (req.method === "GET") {
      const query = new URL(req.url).searchParams;
      if (typeof query.get("call_id") !== "string") {
        res = await sendEjs("templates/auth.html", {
          to: "",
          error: "Call ID is not present in query string",
          success: "",
          call_id: "",
          key: "",
        });
      } else if (typeof query.get("key") !== "string") {
        res = await sendEjs("templates/auth.html", {
          to: "",
          error: "Invalid key in query string",
          success: "",
          call_id: "",
          key: "",
        });
      } else {
        res = await sendEjs("templates/auth.html", {
          to: "",
          error: "",
          success: "",
          call_id: query.get("call_id"),
          key: query.get("key"),
        });
      }
    } else res = await authHandler(req);
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
