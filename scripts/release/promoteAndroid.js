/* eslint-disable no-console */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { getGooglePlayAccessToken } = require("./googlePlayAuth");
const { releaseMetadata, dataSafetyCsv } = require("./androidMetadata");

function requiredArgument(args, name) {
  const index = args.indexOf(name);
  const value = index >= 0 ? args[index + 1] : undefined;
  if (!value || value.startsWith("--")) throw new Error(`Missing ${name}`);
  return value;
}

async function googleRequest(base, token, suffix, method, body) {
  const verb = method || "GET";
  const response = await fetch(`${base}${suffix}`, {
    method: verb,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (response.status === 204) return null;
  const content = await response.text();
  const data = content ? JSON.parse(content) : {};
  if (!response.ok) {
    throw new Error(`Google Play ${verb} failed (${response.status}): ${data.error?.message || "Unknown error"}`);
  }
  return data;
}

async function promoteAndroid(args, { root, parseBuildOutput, recordVersionCode }) {
  const buildId = requiredArgument(args, "--promote-build");
  const notesPath = args.includes("--release-notes") ? requiredArgument(args, "--release-notes") : undefined;
  const app = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8")).expo;
  const result = spawnSync("eas", ["build:view", buildId, "--json"], {
    cwd: root,
    stdio: ["inherit", "pipe", "inherit"],
    encoding: "utf8",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`EAS build lookup failed (${result.status})`);
  const build = parseBuildOutput(result.stdout);
  if (
    build.id !== buildId ||
    build.status !== "FINISHED" ||
    build.buildProfile !== "production" ||
    build.distribution !== "STORE" ||
    build.appVersion !== app.version ||
    (build.appIdentifier && build.appIdentifier !== app.android.package)
  ) {
    throw new Error("The selected build does not match this finished Android production release");
  }

  const metadata = releaseMetadata(root, app.version, notesPath);
  const safetyLabels = args.includes("--sync-data-safety") ? dataSafetyCsv(root) : undefined;
  const token = await getGooglePlayAccessToken();
  const base = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(app.android.package)}`;
  const request = (suffix, method, body) => googleRequest(base, token, suffix, method, body);
  if (safetyLabels) {
    await request("/dataSafety", "POST", { safetyLabels });
    console.log("Updated Google Play Data Safety from version-controlled disclosure");
  }
  const edit = await request("/edits", "POST", {});
  if (!edit.id) throw new Error("Google Play did not return an edit ID");
  const editPath = `/edits/${encodeURIComponent(edit.id)}`;
  let committed = false;
  try {
    const uploaded = await request(`${editPath}/bundles`);
    const versionCode = String(build.appBuildVersion);
    if (!uploaded.bundles?.some((bundle) => String(bundle.versionCode) === versionCode)) {
      throw new Error(`Android version code ${versionCode} is not uploaded to Google Play`);
    }
    const production = await request(`${editPath}/tracks/production`);
    if (production.releases?.some((release) => release.versionCodes?.some((code) => Number(code) > Number(versionCode)))) {
      throw new Error("Refusing to replace a newer Google Play production release");
    }
    if (metadata.contactEmail) {
      const details = await request(`${editPath}/details`);
      await request(`${editPath}/details`, "PATCH", { ...details, contactEmail: metadata.contactEmail });
      const listings = await request(`${editPath}/listings`);
      await Promise.all((listings.listings || []).filter((listing) => listing.fullDescription?.includes("tech@puente-dr.org")).map((listing) =>
        request(`${editPath}/listings/${encodeURIComponent(listing.language)}`, "PATCH", {
          ...listing,
          fullDescription: listing.fullDescription.replaceAll("tech@puente-dr.org", metadata.contactEmail),
        })));
    }
    await request(`${editPath}/tracks/production`, "PUT", {
      track: "production",
      releases: [{
        name: app.version,
        status: "completed",
        versionCodes: [versionCode],
        releaseNotes: metadata.releaseNotes,
      }],
    });
    await request(`${editPath}:validate`, "POST");
    await request(`${editPath}:commit?changesInReviewBehavior=ERROR_IF_IN_REVIEW`, "POST");
    committed = true;
    recordVersionCode(versionCode, root);
    console.log(`Promoted exact Android build ${buildId}, version ${app.version} (${versionCode})`);
  } finally {
    if (!committed) {
      try {
        await request(editPath, "DELETE");
      } catch (error) {
        console.error(`Could not discard the uncommitted Google Play edit: ${error.message}`);
      }
    }
  }
}

module.exports = { googleRequest, promoteAndroid };
