const DEFAULT_TEST_DATABASE_URL = 'postgresql://wordlopol:wordlopol@localhost:5433/wordlopol_test';

export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL;
