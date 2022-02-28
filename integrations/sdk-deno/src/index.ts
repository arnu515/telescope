import { b64, path } from "./deps.ts";
import type { TelescopeOptions } from "./types.ts";

export class TelescopeError extends Error {
  constructor(
    public message: string,
    public body: { error: string; error_description: string },
    public status: number,
  ) {
    super(message);
  }
}

export class Telescope {
  url: string;

  constructor(public opts: TelescopeOptions) {
    this.url = opts.baseUrl || "https://api.telescope.gq";
  }

  private get authHeader() {
    return "Basic " +
      b64.encode([this.opts.clientId, this.opts.clientSecret].join(":"));
  }

  public getUrl(route: string) {
    return path.join(this.url, route);
  }

  public async getCall(callId: string) {
    const res = await fetch(this.getUrl("/api/integrations/calls/" + callId));
    const data = await res.json();
    if (res.ok) {
      return data.call;
    } else {
      throw new TelescopeError(
        "An error occured while fetching the call",
        data,
        res.status,
      );
    }
  }

  public async createCall({ toId, fromId, data: integrationData = {} }: {
    toId: string;
    fromId: string;
    // deno-lint-ignore no-explicit-any
    data: Record<any, any>;
  }) {
    const res = await fetch(this.getUrl("/api/integrations/calls/create"), {
      method: "POST",
      body: JSON.stringify({
        toId,
        fromId,
        data: integrationData,
      }),
      headers: {
        "Content-Type": "application/json",
        "Authorization": this.authHeader,
      },
    });
    const data = await res.json();
    if (res.ok) {
      return data.call;
    } else {
      throw new TelescopeError(
        "An error occured while creating a call",
        data,
        res.status,
      );
    }
  }

  public async getForwardErrorUrl(
    callId: string,
    { error, error_description }: { error: string; error_description: string },
  ) {
    const res = await fetch(
      this.getUrl(`/api/integrations/calls/${callId}/error`),
      {
        method: "POST",
        body: JSON.stringify({
          error,
          error_description,
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": this.authHeader,
        },
      },
    );
    const data = await res.json();
    if (res.ok) {
      return data.url;
    } else {
      throw new TelescopeError(
        "An error occured while fetching the error url",
        data,
        res.status,
      );
    }
  }

  public async getAuthUrl(
    callId: string,
    body: { nickname?: string; avatarUrl?: string } = {},
  ) {
    const res = await fetch(
      this.getUrl(`/api/integrations/calls/${callId}/auth`),
      {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          "Authorization": this.authHeader,
        },
      },
    );
    const data = await res.json();
    if (res.ok) {
      return data.url;
    } else {
      throw new TelescopeError(
        "An error occured while fetching the error url",
        data,
        res.status,
      );
    }
  }
}
