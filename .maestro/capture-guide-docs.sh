#!/usr/bin/env bash
#
# Capture every public-guide screenshot, in English and in Spanish.
#
#   ./.maestro/capture-guide-docs.sh both     # default
#   ./.maestro/capture-guide-docs.sh es
#
# Metro must already be running:  yarn start:staging-clear
#
# WHY THIS EXISTS
# The guides are bilingual; their screenshots were not. Every image on the
# Spanish page showed an English app, which leaves the reader who needs Spanish
# translating button names in their head — the reader least able to do it.
#
# HOW THE LANGUAGE IS SET
# Collect reads the DEVICE language once at launch (modules/i18n calls
# expo-localization's getLocales() at module load). So the simulator's language
# is changed and the simulator RESTARTED — relaunching the app is not enough,
# because the system reads the preference at boot.
#
# es_DO, not es_ES: the Dominican Republic is where this app is used, and the
# locale affects the date and number formatting visible in the images.
#
# WHY THERE ARE NO STRING ARGUMENTS HERE
# The flows carry English|Spanish alternations in their selectors instead.
# Maestro matches text as a regex, so one selector covers both languages — and
# a flow-file `env:` default OVERRIDES `-e` on the command line in this version
# of Maestro (verified 2026-09-11 with a two-line flow, after it silently kept
# the English selectors through an entire Spanish run). Passing twenty strings
# would have re-created that trap twenty times.
set -euo pipefail

cd "$(dirname "$0")/.."
WHICH="${1:-both}"
DEVICE="${MAESTRO_DEVICE:-$(xcrun simctl list devices booted -j | python3 -c '
import json,sys
d=json.load(sys.stdin)["devices"]
print(next(dev["udid"] for runtime in d.values() for dev in runtime))')}"

echo "device: $DEVICE"

set_language () {
  local lang="$1" locale="$2"
  echo "→ setting simulator language to $lang ($locale)"
  xcrun simctl spawn "$DEVICE" defaults write -g AppleLanguages -array "$lang"
  xcrun simctl spawn "$DEVICE" defaults write -g AppleLocale -string "$locale"
  # The system reads these at boot, so the restart is not optional.
  xcrun simctl shutdown "$DEVICE"
  xcrun simctl boot "$DEVICE"
  xcrun simctl bootstatus "$DEVICE" >/dev/null
  sleep 5
}

capture () {
  local out_suffix="$1"
  yarn maestro .maestro/capture-find-records-docs.yaml \
    ${out_suffix:+-e OUT="docs/img/find-records/$out_suffix"}
  yarn maestro .maestro/capture-offline-docs.yaml \
    ${out_suffix:+-e OUT="docs/img/offline/$out_suffix"}
  yarn maestro .maestro/capture-org-signup-docs.yaml \
    ${out_suffix:+-e OUT="docs/img/organizations/$out_suffix"}
}

case "$WHICH" in
  en)   set_language en en_US; echo "══ English ══"; capture "" ;;
  es)   set_language es es_DO; echo "══ Español ══"; capture "es" ;;
  both) set_language en en_US; echo "══ English ══"; capture ""
        set_language es es_DO; echo "══ Español ══"; capture "es"
        # Leave the device in English: every other flow in the suite asserts
        # English strings first, and while they now also accept Spanish, the
        # next person to run one should get the device they expect.
        set_language en en_US ;;
  *) echo "usage: $0 [en|es|both]" >&2; exit 2 ;;
esac

echo
echo "images:"
echo "  docs/img/find-records/       docs/img/find-records/es/"
echo "  docs/img/offline/            docs/img/offline/es/"
echo "  docs/img/organizations/      docs/img/organizations/es/"
