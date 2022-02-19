import { esLintAllFiles, esLintChangedFiles, sampleChangedFiles } from './fixtures/envs';

// Implement workaround for using dynamic import
// https://stackoverflow.com/questions/60697477/jest-not-matching-custom-error-type-when-using-dynamic-import
let Errors: typeof import('../source/errors');
async function load() {
  Errors = await import('../source/errors');
}

describe('Test action inputs', () => {
  const STARTUP_ENVs = process.env;

  beforeEach(async() => {
    jest.resetModules() // Most important - it clears the cache
    await load();
  });

  afterAll(() => {
    process.env = STARTUP_ENVs; // Restore old environment
  });

  test('Test correct Envs: All files', () => {
    process.env = { ...STARTUP_ENVs, ...esLintAllFiles };

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const constants = require('../source/constants').default;

    expect(constants.input.fileName).toBe(esLintAllFiles.INPUT_FILENAME);
    expect(constants.repo.token).toBe(esLintAllFiles.INPUT_TOKEN);
    expect(constants.input.isAnnotateOnlyChangedFiles).not.toBeTruthy();
    expect(constants.input.changedFiles.length).toBe(0);
  });

  test('Test correct Envs: Changed Files', () => {
    process.env = { ...STARTUP_ENVs, ...esLintChangedFiles };

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const constants = require('../source/constants').default;

    expect(constants.input.fileName).toBe(esLintAllFiles.INPUT_FILENAME);
    expect(constants.repo.token).toBe(esLintAllFiles.INPUT_TOKEN);
    expect(constants.input.isAnnotateOnlyChangedFiles).toBeTruthy();
    expect(constants.input.changedFiles.length).toBe(3);
    expect(constants.input.changedFiles).toEqual(sampleChangedFiles);
  });

  test('Test incorrect Envs: No File Name', () => {
    process.env = { ...STARTUP_ENVs, ...esLintAllFiles };
    delete process.env.INPUT_FILENAME;

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    expect(() => {require('../source/constants');}).toThrow(Errors.NoRequiredImport);
  });

  test('Test incorrect Envs: No GitHub Token', () => {
    process.env = { ...STARTUP_ENVs, ...esLintAllFiles };
    delete process.env.INPUT_TOKEN;

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    expect(() => {require('../source/constants');}).toThrow(Errors.NoRequiredImport);
  });

  test('Test incorrect Envs: No Annotate only changed files attribute', () => {
    process.env = { ...STARTUP_ENVs, ...esLintAllFiles };
    delete process.env.INPUT_ANNOTATEONLYCHANGEDFILES;

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    expect(() => {require('../source/constants');}).toThrow(Errors.NoRequiredImport);
  });

  test('Test incorrect Envs: No Change file list on Annotate only changed files mode', () => {
    process.env = { ...STARTUP_ENVs, ...esLintChangedFiles };
    delete process.env.INPUT_CHANGEDFILES;

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    expect(() => {require('../source/constants');}).toThrow(Errors.NoRequiredImport);
  });
});