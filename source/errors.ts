const noRequiredInputMessage = (inputName: string) => `There is no required input: '${inputName}'`;
const noReportFileMessage = (fileName: string) =>
  `There is no .SARIF report '${fileName}' in repository`;

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
