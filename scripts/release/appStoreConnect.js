/* eslint-disable no-console */

const crypto = require("crypto");
const fs = require("fs");

const API_ROOT = "https://api.appstoreconnect.apple.com/v1";

function createToken({ keyId, issuerId, privateKey }, now = Date.now()) {
  const issuedAt = Math.floor(now / 1000);
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = [
    encode({ alg: "ES256", kid: keyId, typ: "JWT" }),
    encode({ iss: issuerId, iat: issuedAt, exp: issuedAt + 19 * 60, aud: "appstoreconnect-v1" }),
  ].join(".");
  const signature = crypto.sign("SHA256", Buffer.from(unsigned), {
    key: privateKey.replace(/\\n/g, "\n"),
    dsaEncoding: "ieee-p1363",
  });

  return `${unsigned}.${signature.toString("base64url")}`;
}

function readAppStoreCredentials(env = process.env) {
  const keyPath = env.EXPO_ASC_API_KEY_PATH;
  const privateKey = env.ASC_PRIVATE_KEY || (keyPath && fs.readFileSync(keyPath, "utf8"));
  const credentials = {
    keyId: env.ASC_KEY_ID || env.EXPO_ASC_KEY_ID,
    issuerId: env.ASC_ISSUER_ID || env.EXPO_ASC_ISSUER_ID,
    privateKey,
  };
  const missing = Object.entries(credentials)
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length) {
    throw new Error(
      `Missing App Store Connect API credentials: ${missing.join(", ")}. ` +
      "The release cannot automate TestFlight notes without them."
    );
  }

  return credentials;
}

function buildLookupUrl({ appId, marketingVersion, buildNumber }) {
  const url = new URL(`${API_ROOT}/builds`);
  url.searchParams.set("filter[app]", appId);
  url.searchParams.set("filter[version]", buildNumber);
  url.searchParams.set("filter[preReleaseVersion.version]", marketingVersion);
  url.searchParams.set("filter[preReleaseVersion.platform]", "IOS");
  url.searchParams.set("limit", "1");
  return url.toString();
}

async function apiRequest({ credentials, fetchImpl = fetch }, url, options = {}) {
  const response = await fetchImpl(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${createToken(credentials)}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const payload = await response.json();

  if (!response.ok) {
    const detail = payload.errors?.map((error) => error.detail).join("; ");
    throw new Error(`App Store Connect API returned HTTP ${response.status}: ${detail || "unknown error"}`);
  }

  return payload;
}

async function waitForProcessedBuild({
  appId,
  marketingVersion,
  buildNumber,
  credentials,
  fetchImpl = fetch,
  sleep = (milliseconds) => new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  }),
  attempts = 60,
  intervalMs = 30000,
}) {
  const url = buildLookupUrl({ appId, marketingVersion, buildNumber });
  const check = async (attempt) => {
    const payload = await apiRequest({ credentials, fetchImpl }, url);
    const build = payload.data?.[0];
    const state = build?.attributes?.processingState;

    if (state === "VALID") return build;
    if (state === "FAILED" || state === "INVALID") {
      throw new Error(`Apple marked build ${marketingVersion} (${buildNumber}) as ${state}`);
    }
    if (attempt >= attempts) {
      throw new Error(
        `Timed out waiting for Apple to process build ${marketingVersion} (${buildNumber})`
      );
    }

    await sleep(intervalMs);
    return check(attempt + 1);
  };

  return check(1);
}

function createLocalizationBody(buildId, notes) {
  return {
    data: {
      type: "betaBuildLocalizations",
      attributes: { locale: "en-US", whatsNew: notes },
      relationships: {
        build: { data: { type: "builds", id: buildId } },
      },
    },
  };
}

function updateLocalizationBody(localizationId, notes) {
  return {
    data: {
      type: "betaBuildLocalizations",
      id: localizationId,
      attributes: { whatsNew: notes },
    },
  };
}

async function setTestFlightNotes(options) {
  const { credentials, fetchImpl = fetch, notes } = options;
  const build = await waitForProcessedBuild(options);
  const localizationsUrl = `${API_ROOT}/builds/${build.id}/betaBuildLocalizations`;
  const existing = await apiRequest({ credentials, fetchImpl }, localizationsUrl);
  const english = existing.data?.find((entry) => entry.attributes?.locale === "en-US");

  if (english) {
    await apiRequest(
      { credentials, fetchImpl },
      `${API_ROOT}/betaBuildLocalizations/${english.id}`,
      { method: "PATCH", body: JSON.stringify(updateLocalizationBody(english.id, notes)) }
    );
  } else {
    await apiRequest(
      { credentials, fetchImpl },
      `${API_ROOT}/betaBuildLocalizations`,
      { method: "POST", body: JSON.stringify(createLocalizationBody(build.id, notes)) }
    );
  }

  console.log(`✅ TestFlight “What to Test” synced for build ${options.buildNumber}`);
  return build;
}

module.exports = {
  buildLookupUrl,
  createLocalizationBody,
  createToken,
  readAppStoreCredentials,
  setTestFlightNotes,
  updateLocalizationBody,
  waitForProcessedBuild,
};
