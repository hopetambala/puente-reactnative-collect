/**
 * Decides which list an autofill field should offer, and never throws.
 *
 * Extracted as a pure function because this is where the field has been broken
 * since January 2022. `cacheAutofillData` returns the enclosing function
 * instead of the array it built; `JSON.stringify` then drops the
 * function-valued property, so `organization` never reaches storage at all. The
 * component called `data[parameter].sort()` on `undefined`, threw, and the
 * throw was swallowed by a catch — leaving a silent free-text box with one
 * `console.error` as the only trace.
 *
 * `options` wins when supplied: the signup screen reads the `Organization`
 * class directly, because the cache derives from `_User` free-text strings and
 * is populated only AFTER login — so on a fresh install it holds nothing at the
 * exact moment the organization list is needed.
 *
 * Anything that is not an array of usable strings yields an empty list, and the
 * field degrades to free text. That is today's behaviour, and the server
 * resolves or refuses whatever is typed regardless.
 */
export function resolveAutofillFields({ options, cached, parameter } = {}) {
  const source = Array.isArray(options)
    ? options
    : (cached && cached[parameter]);

  if (!Array.isArray(source)) return [];

  return [...new Set(source.filter((v) => typeof v === "string" && v.trim()))]
    // Sorted for scanning, accent-aware because the names are Spanish.
    .sort((a, b) => a.localeCompare(b, "es"));
}
