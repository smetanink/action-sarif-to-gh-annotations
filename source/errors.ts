const noRequiredInputMessage = (inputName: string) => `There is no required input: '${inputName}'`;
const noReportFileMessage = (fileName: string) =>
  `There is no .SARIF report '${fileName}' in repository`;
const invalidJsonContentMessage = (fileName: string) =>
  `File '${fileName}' contain invalid JSON content`;
const invalidSarifFormatMessage = (fileName: string) =>
  `Content of file '${fileName}' does not comply with SARIF v2.1.0`;

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
