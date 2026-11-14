// Cloudflare Worker: TradingView webhook  ->  GitHub repository_dispatch
// TradingView cannot send custom headers, so this tiny relay adds the GitHub token.
//
// Required Worker secrets / variables:
//   GITHUB_TOKEN  : fine-grained PAT with "Contents: Read & write" on the repo
//   GITHUB_REPO   : "owner/repo"   e.g. 9a999a/fibo-trend
//   PASSPHRASE    : any secret string; put the same value in the URL (?key=...)

export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("POST only", { status: 405 });

    const url = new URL(request.url);
    if (url.searchParams.get("key") !== env.PASSPHRASE) {
      return new Response("unauthorized", { status: 401 });
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response("body must be JSON", { status: 400 });
    }

    const gh = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/dispatches`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "fibo-trend-relay",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ event_type: "tv_signal", client_payload: payload }),
    });

    return new Response(gh.ok ? "ok" : `github error ${gh.status}`, { status: gh.ok ? 200 : 502 });
  },
};
