import { getData, storeData } from "@modules/async-storage";

/** AsyncStorage key for the last known organization set. */
export const ORGANIZATION_CACHE_KEY = "organization_set";

/** Cap on the organization read; they are created by hand and number in dozens. */
export const ORGANIZATION_FETCH_LIMIT = 500;

/**
 * Case- and accent-insensitive fold. Kept identical to the resolvers in
 * puente-node-cloudcode (cloud/src/services/organization/organization.js) and
 * puente-react-nextjs-platform (app/modules/organization/index.js). If the
 * three diverge, the three systems disagree about who owns a record.
 */
export function normalizeOrganizationName(value) {
  if (typeof value !== "string") return null;
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase();
}

/**
 * Every `surveyingOrganization` string that belongs to one organization.
 *
 * Records carry the string that was COLLECTED, and one organization's records
 * are spread across several. Measured in production 2026-08-29: DR Missions
 * has 11 rows under "DR Missions" and 611 under "DRMT"; Rayjon has 185 under
 * "Rayjon" and 1196 under "Rayjon Eye Clinic". Filtering on a single string
 * showed those surveyors 1% and 11% of their own organization's records, and
 * two DR Missions accounts saw nothing at all.
 *
 * Use with `containedIn`, never `equalTo`.
 *
 * Falls back to `[name]` whenever the organization cannot be identified — an
 * unrecognised organization must still see its own records.
 */
export function organizationMatchValues(name, organizations = []) {
  const wanted = normalizeOrganizationName(name);
  if (wanted === null) return [name];

  const matches = organizations.filter((org) => {
    // The canonical name is always an implicit alias.
    const candidates = [org.name, ...(org.aliases || [])];
    return candidates.some(
      (candidate) => normalizeOrganizationName(candidate) === wanted
    );
  });

  // Two organizations claiming one alias is an ops problem. Narrow to the
  // literal string rather than guessing which tenant the surveyor belongs to.
  if (matches.length !== 1) return [name];

  const org = matches[0];
  return Array.from(
    new Set([org.name, ...(org.aliases || [])].filter(Boolean))
  );
}

const toPlain = (records) =>
  records.map((r) => ({
    objectId: r.id,
    name: r.get("name"),
    shortCode: r.get("shortCode"),
    aliases: r.get("aliases") || [],
  }));

/**
 * The organization set for this surveyor, cached for offline use.
 *
 * Collect is offline-first, so this must not depend on a connection: a scope
 * that only resolves online would narrow every surveyor's records the moment
 * they lose signal, which in the field is most of the time. The set is written
 * to AsyncStorage on every successful read and served from there otherwise.
 */
export async function loadOrganizationScope(organization, Parse) {
  let organizations = null;

  try {
    const query = new Parse.Query("Organization");
    query.select("name", "shortCode", "aliases", "active");
    query.limit(ORGANIZATION_FETCH_LIMIT);
    organizations = toPlain(await query.find());
    await storeData(organizations, ORGANIZATION_CACHE_KEY);
  } catch (error) {
    // Offline, or the read failed. Fall back to the last known set.
    try {
      organizations = await getData(ORGANIZATION_CACHE_KEY);
    } catch (cacheError) {
      organizations = null;
    }
  }

  if (!organizations || !organizations.length) return [organization];
  return organizationMatchValues(organization, organizations);
}
