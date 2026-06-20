import getAWSLogger from "@modules/aws-logging/logger";
import { deleteData } from "@modules/async-storage";

async function invalidateResidentCache(residentId) {
  try {
    getAWSLogger().log({ type: "INVALIDATE_RESIDENT_CACHE", residentId });
    await deleteData("residentData");
  } catch (error) {
    getAWSLogger().log({ type: "INVALIDATE_RESIDENT_CACHE_ERROR", message: String(error) });
  }
}

export { invalidateResidentCache };
