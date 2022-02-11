'use strict';

import FS from 'fs';

import { StaticAnalysisResultsFormatSARIFVersion210Rtm4JSONSchema as SchemaV210 } from './schemas/sarif-schema-2.1.0';
import { InvalidJsonContent, InvalidSarifFormat, NoReportFile } from '../errors';

function getFile(fileName: string): string {
  if (FS.existsSync(fileName)) {
    return FS.readFileSync(fileName, { encoding: 'utf-8' });
  } else {
    throw new NoReportFile(fileName);
  }
}

function parseSarifReport(fileName: string, fileContent: string): SchemaV210 {
  try {
    return JSON.parse(fileContent) as SchemaV210;
  } catch (e) {
    throw new InvalidJsonContent(fileName);
  }
}

export default function getSarifReport(fileName: string): SchemaV210 {
  const fileTextContent = getFile(fileName);
  const fileContent = parseSarifReport(fileName, fileTextContent);
  try {
    return fileContent;
  } catch (e) {
    throw new InvalidSarifFormat(fileName);
  }
}
