import { initialize } from '../services/parse/auth';

// https://medium.com/@phatdev/testing-everything-against-the-real-database-in-nodejs-typescript-application-by-integrating-unit-31b12866d538
export default function hooks() {
  beforeAll(async () => initialize());
}
