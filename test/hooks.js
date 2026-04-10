import { initialize } from "@app/services/parse/auth";

// https://medium.com/@phatdev/testing-everything-against-the-real-database-in-nodejs-typescript-application-by-integrating-unit-31b12866d538
export default function hooks() {
  process.env.APP_ENV = "test";
  beforeAll(async () => initialize());
}
