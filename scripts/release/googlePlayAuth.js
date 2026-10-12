/* global globalThis */

const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const DEFAULT_CLIENT_EMAIL = "play-console-puente-collect@puente-collect-432600.iam.gserviceaccount.com";
const EAS_GRAPHQL_URL = "https://api.expo.dev/graphql";

function readCredentialFile(filePath, description) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_) {
    throw new Error(`Unable to read ${description} credentials.`);
  }
}

async function getGooglePlayAccessToken({ env = process.env, homeDir = os.homedir(), fetch: request = globalThis.fetch } = {}) {
  if (env.GOOGLE_PLAY_ACCESS_TOKEN) return env.GOOGLE_PLAY_ACCESS_TOKEN;

  let serviceAccount;
  if (env.GOOGLE_PLAY_SERVICE_ACCOUNT_PATH) {
    serviceAccount = readCredentialFile(env.GOOGLE_PLAY_SERVICE_ACCOUNT_PATH, "service-account");
  } else {
    const state = readCredentialFile(path.join(homeDir, ".expo", "state.json"), "saved EAS session");
    const { username, sessionSecret } = state.auth || {};
    if (!username || !sessionSecret) throw new Error("A saved EAS authentication session or Google Play service-account credentials are required.");

    const queryEas = async (query, variables) => {
      const response = await request(EAS_GRAPHQL_URL, {
        method: "POST",
        headers: { "content-type": "application/json", "expo-session": sessionSecret },
        body: JSON.stringify({ query, variables }),
      });
      if (!response.ok) throw new Error(`EAS credential request failed (${response.status}).`);
      const result = await response.json();
      if (result.errors || !result.data) throw new Error("EAS did not return the requested service-account credentials.");
      return result.data;
    };

    const account = await queryEas(
      "query($name: String!) { account { byName(accountName: $name) { googleServiceAccountKeysPaginated(first: 100) { edges { node { id clientEmail } } } } } }",
      { name: username },
    );
    const keys = account.account?.byName?.googleServiceAccountKeysPaginated?.edges || [];
    const expectedEmail = env.GOOGLE_PLAY_CLIENT_EMAIL || DEFAULT_CLIENT_EMAIL;
    const key = keys.find(({ node }) => node.clientEmail === expectedEmail)?.node;
    if (!key) throw new Error("No matching Google Play service-account credentials were found in EAS.");
    const result = await queryEas(
      "query($id: ID!) { googleServiceAccountKey { byId(id: $id) { keyJson } } }",
      { id: key.id },
    );
    const keyJson = result.googleServiceAccountKey?.byId?.keyJson;
    try {
      serviceAccount = typeof keyJson === "string" ? JSON.parse(keyJson) : keyJson;
    } catch (_) {
      throw new Error("EAS returned invalid service-account credentials.");
    }
  }

  if (!serviceAccount?.client_email || !serviceAccount.private_key || !serviceAccount.token_uri) {
    throw new Error("Service-account credentials require client_email, private_key, and token_uri.");
  }

  const now = Math.floor(Date.now() / 1000);
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: serviceAccount.token_uri,
    iat: now,
    exp: now + 3600,
  })}`;
  let signature;
  try {
    signature = crypto.sign("RSA-SHA256", Buffer.from(unsigned), serviceAccount.private_key).toString("base64url");
  } catch (_) {
    throw new Error("Unable to sign Google Play OAuth request with service-account credentials.");
  }
  const response = await request(serviceAccount.token_uri, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }).toString(),
  });
  if (!response.ok) throw new Error(`Google Play OAuth token exchange rejected (${response.status}).`);
  const result = await response.json();
  if (!result.access_token) throw new Error("Google Play OAuth did not return an access token.");
  return result.access_token;
}

module.exports = { getGooglePlayAccessToken };
