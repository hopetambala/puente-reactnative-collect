import { deleteData } from "@modules/async-storage";

async function invalidateResidentCache(residentId) {
  try {
    await deleteData("residentData");
  } catch (error) {
    console.error("invalidateResidentCache failed for", residentId, error);
  }
}

export { invalidateResidentCache };
