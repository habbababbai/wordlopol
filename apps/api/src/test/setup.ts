import { TEST_DATABASE_URL } from './constants.js';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = TEST_DATABASE_URL;
