interface ActionInputs {
    INPUT_FILENAME: string;
    INPUT_TOKEN: string;
    INPUT_ANNOTATEONLYCHANGEDFILES: 'true' | 'false';
    INPUT_CHANGEDFILES: string;
    GITHUB_REPOSITORY: string;
}

export const esLintAllFiles: ActionInputs = {
    INPUT_FILENAME: './test/sarif_example/eslint.json',
    INPUT_TOKEN: 'qwerty',
    INPUT_ANNOTATEONLYCHANGEDFILES: 'false',
    INPUT_CHANGEDFILES: '',
    GITHUB_REPOSITORY: 'owner/repo',
};

export const sampleChangedFiles: string[] = [
    'source/index.ts',
    'source/errors.ts',
    'source/constants.ts'
];

export const esLintChangedFiles: ActionInputs = {
    ...esLintAllFiles,
    INPUT_ANNOTATEONLYCHANGEDFILES: 'true',
    INPUT_CHANGEDFILES: `${sampleChangedFiles[0]} /${sampleChangedFiles[1]} ./${sampleChangedFiles[2]}`,
};