// Test fixture: records arguments without executing the Maestro CLI or preflight.
const fs = require('fs');

const [command, ...args] = process.argv.slice(2);

const record = `${JSON.stringify({
  command,
  args,
  javaHome: process.env.JAVA_HOME,
  appEnv: process.env.APP_ENV,
  publicAppEnv: process.env.EXPO_PUBLIC_APP_ENV,
})}\n`;

if (process.env.MAESTRO_TEST_RECORD_FILE) {
  fs.appendFileSync(process.env.MAESTRO_TEST_RECORD_FILE, record);
} else {
  process.stdout.write(record);
}

if (command === 'preflight') {
  process.exit(Number(process.env.MAESTRO_TEST_PREFLIGHT_STATUS || 0));
}
