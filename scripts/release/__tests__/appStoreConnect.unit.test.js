const crypto = require("crypto");

const {
  buildLookupUrl,
  createLocalizationBody,
  createToken,
  updateLocalizationBody,
  waitForProcessedBuild,
} = require("@app/scripts/release/appStoreConnect");

describe("App Store Connect TestFlight metadata", () => {
  const { privateKey } = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
  const credentials = {
    keyId: "KEY1234567",
    issuerId: "issuer-id",
    privateKey: privateKey.export({ type: "pkcs8", format: "pem" }),
  };

  it("creates a short-lived App Store Connect token", () => {
    const token = createToken(credentials, 1_000_000);
    const [header, payload, signature] = token.split(".");

    expect(JSON.parse(Buffer.from(header, "base64url"))).toMatchObject({
      alg: "ES256",
      kid: credentials.keyId,
    });
    expect(JSON.parse(Buffer.from(payload, "base64url"))).toMatchObject({
      iss: credentials.issuerId,
      aud: "appstoreconnect-v1",
    });
    expect(Buffer.from(signature, "base64url")).toHaveLength(64);
  });

  it("looks up only the intended iOS marketing version and build number", () => {
    const url = new URL(
      buildLookupUrl({ appId: "1362371696", marketingVersion: "15.7.5", buildNumber: "8" })
    );

    expect(url.searchParams.get("filter[app]")).toBe("1362371696");
    expect(url.searchParams.get("filter[version]")).toBe("8");
    expect(url.searchParams.get("filter[preReleaseVersion.version]")).toBe("15.7.5");
    expect(url.searchParams.get("filter[preReleaseVersion.platform]")).toBe("IOS");
  });

  it("creates and updates English TestFlight notes", () => {
    expect(createLocalizationBody("build-id", "Test this")).toMatchObject({
      data: {
        type: "betaBuildLocalizations",
        attributes: { locale: "en-US", whatsNew: "Test this" },
        relationships: { build: { data: { id: "build-id" } } },
      },
    });
    expect(updateLocalizationBody("localization-id", "Test this")).toEqual({
      data: {
        type: "betaBuildLocalizations",
        id: "localization-id",
        attributes: { whatsNew: "Test this" },
      },
    });
  });

  it("waits until Apple marks the exact build valid", async () => {
    const responses = ["PROCESSING", "VALID"];
    const fetchImpl = jest.fn().mockImplementation(async () => ({
      ok: true,
      json: async () => ({
        data: [{ id: "apple-build-id", attributes: { processingState: responses.shift() } }],
      }),
    }));
    const sleep = jest.fn().mockResolvedValue();

    await expect(
      waitForProcessedBuild({
        appId: "1362371696",
        marketingVersion: "15.7.5",
        buildNumber: "8",
        credentials,
        fetchImpl,
        sleep,
        attempts: 2,
        intervalMs: 1,
      })
    ).resolves.toMatchObject({ id: "apple-build-id" });
    expect(sleep).toHaveBeenCalledTimes(1);
  });
});
