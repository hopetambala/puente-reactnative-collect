import { deleteData } from "@modules/async-storage";

/**
 * Invalidate cache for a specific resident.
 * Currently clears the entire residentData cache (simple approach).
 * Can be enhanced later to do granular per-resident invalidation.
 * @param {string} residentId - The ID of the resident to invalidate
 */
async function invalidateResidentCache(residentId) {
  try {
    console.log(`Invalidating cache for resident: ${residentId}`);
    await deleteData("residentData");
  } catch (error) {
    console.error("Error invalidating resident cache:", error);
  }
}

/**
 * Invalidate all resident data cache.
 * Clears the entire residentData async storage key.
 */
async function invalidateAllResidentData() {
  try {
    console.log("Invalidating all resident data cache");
    await deleteData("residentData");
  } catch (error) {
    console.error("Error invalidating all resident data:", error);
  }
}

export { invalidateAllResidentData, invalidateResidentCache };
