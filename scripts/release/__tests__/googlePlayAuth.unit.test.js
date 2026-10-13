const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { getGooglePlayAccessToken } = require("@app/scripts/release/googlePlayAuth");

describe("Google Play release authentication", () => {
  const clientEmail = "play-console-puente-collect@puente-collect-432600.iam.gserviceaccount.com";
  let homeDir;
  let fixtureKey;
  let publicKey;
  let fakeFetch;

  beforeEach(() => {
    homeDir = fs.mkdtempSync(path.join(os.tmpdir(), "google-play-auth-"));
    const pair = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
    publicKey = pair.publicKey;
    fixtureKey = {
      type: "service_account",
      client_email: clientEmail,
      private_key: pair.privateKey.export({ type: "pkcs8", format: "pem" }),
      token_uri: "https://oauth2.googleapis.com/token",
    };
    // Any unexpected transport fails locally, rather than falling back to real credentials.
    fakeFetch = jest.fn(async () => { throw new Error("Unexpected fixture network request"); });
  });

  afterEach(() => fs.rmSync(homeDir, { recursive: true, force: true }));

  function respond(data, status = 200) {
    return { ok: status >= 200 && status < 300, status, json: async () => data, text: async () => JSON.stringify(data) };
  }

  function verifyTokenExchange(url, options) {
    expect(String(url)).toBe(fixtureKey.token_uri);
    expect(options.method).toBe("POST");
    const form = new URLSearchParams(options.body);
    expect(form.get("grant_type")).toBe("urn:ietf:params:oauth:grant-type:jwt-bearer");
    const assertion = form.get("assertion");
    const [header, payload, signature] = assertion.split(".");
    expect(JSON.parse(Buffer.from(header, "base64url"))).toEqual(expect.objectContaining({ alg: "RS256" }));
    const claims = JSON.parse(Buffer.from(payload, "base64url"));
    expect(claims).toEqual(expect.objectContaining({
      iss: fixtureKey.client_email,
      scope: "https://www.googleapis.com/auth/androidpublisher",
      aud: fixtureKey.token_uri,
    }));
    expect(claims.iat).toBeLessThanOrEqual(Math.floor(Date.now() / 1000));
    expect(claims.exp).toBeGreaterThan(claims.iat);
    expect(claims.exp - claims.iat).toBeLessThanOrEqual(3600);
    expect(crypto.verify("RSA-SHA256", Buffer.from(`${header}.${payload}`), publicKey, Buffer.from(signature, "base64url"))).toBe(true);
    return respond({ access_token: "fixture-google-token", token_type: "Bearer", expires_in: 3600 });
  }

  it("uses an explicitly supplied access token without reading saved credentials or calling a network", async () => {
    const result = await getGooglePlayAccessToken({ env: { GOOGLE_PLAY_ACCESS_TOKEN: "explicit-fixture-token" }, homeDir, fetch: fakeFetch });
    expect(result).toBe("explicit-fixture-token");
    expect(fakeFetch).not.toHaveBeenCalled();
  });

  it("exchanges a configured service-account file for a correctly signed scoped token", async () => {
    const keyPath = path.join(homeDir, "service-account.json");
    fs.writeFileSync(keyPath, JSON.stringify(fixtureKey));
    fakeFetch.mockImplementation(verifyTokenExchange);
    const result = await getGooglePlayAccessToken({ env: { GOOGLE_PLAY_SERVICE_ACCOUNT_PATH: keyPath }, homeDir, fetch: fakeFetch });
    expect(result).toBe("fixture-google-token");
    expect(fakeFetch).toHaveBeenCalledTimes(1);
  });

  it.each([undefined, "custom-publisher@fixture.invalid"])("uses the saved EAS session and matching key, honoring client-email override %s", async (overrideEmail) => {
    const matchingEmail = overrideEmail || clientEmail;
    fixtureKey.client_email = matchingEmail;
    fs.mkdirSync(path.join(homeDir, ".expo"));
    fs.writeFileSync(path.join(homeDir, ".expo/state.json"), JSON.stringify({ auth: { username: "fixture-owner", sessionSecret: "fixture-eas-session" } }));
    fakeFetch.mockImplementation(async (url, options) => {
      if (String(url) === fixtureKey.token_uri) return verifyTokenExchange(url, options);
      expect(String(url)).toBe("https://api.expo.dev/graphql");
      expect(options.method).toBe("POST");
      expect(new Headers(options.headers).get("expo-session")).toBe("fixture-eas-session");
      const request = JSON.parse(options.body);
      if (request.query.includes("googleServiceAccountKeysPaginated")) {
        expect(Object.values(request.variables)).toContain("fixture-owner");
        return respond({ data: { account: { byName: { googleServiceAccountKeysPaginated: { edges: [
          { node: { id: "wrong-key", clientEmail: "unrelated@fixture.invalid" } },
          { node: { id: "expected-key", clientEmail: matchingEmail } },
        ] } } } } });
      }
      expect(request.query).toContain("googleServiceAccountKey");
      expect(Object.values(request.variables)).toContain("expected-key");
      return respond({ data: { googleServiceAccountKey: { byId: { keyJson: JSON.stringify(fixtureKey) } } } });
    });
    const env = overrideEmail ? { GOOGLE_PLAY_CLIENT_EMAIL: overrideEmail } : {};
    const result = await getGooglePlayAccessToken({ env, homeDir, fetch: fakeFetch });
    expect(result).toBe("fixture-google-token");
    expect(fakeFetch).toHaveBeenCalledTimes(3);
  });

  it("fails usefully when neither an access token, service account, nor saved EAS session exists", async () => {
    await expect(getGooglePlayAccessToken({ env: {}, homeDir, fetch: fakeFetch })).rejects.toThrow(/credential|session|auth|service.account/i);
    expect(fakeFetch).not.toHaveBeenCalled();
  });

  it("rejects malformed service-account files without exposing contents or calling a network", async () => {
    const keyPath = path.join(homeDir, "malformed.json");
    fs.writeFileSync(keyPath, JSON.stringify({ private_key: "fixture-sensitive-key-material" }));
    const promise = getGooglePlayAccessToken({ env: { GOOGLE_PLAY_SERVICE_ACCOUNT_PATH: keyPath }, homeDir, fetch: fakeFetch });
    await expect(promise).rejects.toThrow(/service.account|client.email|credential/i);
    await expect(promise).rejects.not.toThrow("fixture-sensitive-key-material");
    expect(fakeFetch).not.toHaveBeenCalled();
  });

  it("reports rejected OAuth exchanges without returning a token", async () => {
    const keyPath = path.join(homeDir, "service-account.json");
    fs.writeFileSync(keyPath, JSON.stringify(fixtureKey));
    fakeFetch.mockImplementation(async (url, options) => {
      verifyTokenExchange(url, options);
      return respond({ error: "invalid_grant", error_description: "Fixture credentials rejected" }, 400);
    });
    await expect(getGooglePlayAccessToken({ env: { GOOGLE_PLAY_SERVICE_ACCOUNT_PATH: keyPath }, homeDir, fetch: fakeFetch })).rejects.toThrow(/OAuth|token|invalid_grant|rejected/i);
  });
});
