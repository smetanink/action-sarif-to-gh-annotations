const noRequiredInputMessage = (inputName: string) => `There is no required input: '${inputName}'`;
const noReportFileMessage = (fileName: string) =>
  `There is no .SARIF report '${fileName}' in repository`;
const invalidJsonContentMessage = (fileName: string) =>
  `File '${fileName}' contain invalid JSON content`;
const invalidSarifFormatMessage = (fileName: string) =>
  `Content of file '${fileName}' does not comply with SARIF v2.1.0`;
const invalidSarifViolationDataMessage =
  'Unexpected .SARIF report data. Both sarif.runs[0].tool.driver.rules and sarif.runs[0].results must have or must have not elements at the same time.';
const invalidSarifDriverMessage = (driverName: string) =>
  `Invalid driver '${driverName}'. Correct drivers are: PMD, ESLint.`;

export class NoRequiredImport extends Error {
  constructor(inputName: string) {
    super(noRequiredInputMessage(inputName));
  }
}

export class NoReportFile extends Error {
  constructor(fileName: string) {
    super(noReportFileMessage(fileName));
  }
}

export class InvalidJsonContent extends Error {
  constructor(fileName: string) {
    super(invalidJsonContentMessage(fileName));
  }
}

export class InvalidSarifFormat extends Error {
  constructor(fileName: string) {
    super(invalidSarifFormatMessage(fileName));
  }
}

export class InvalidSarifViolationData extends Error {
  constructor() {
    super(invalidSarifViolationDataMessage);
  }
}

export class InvalidSarifDriver extends Error {
  constructor(driverName: string) {
    super(invalidSarifDriverMessage(driverName));
  }
}
