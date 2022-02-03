'use strict';

import FS from 'fs';
import { StaticAnalysisResultsFormatSARIFVersion210Rtm4JSONSchema as SchemaV210 } from './sarif-schema-2.1.0';

import { InvalidJsonContent, InvalidSarifFormat, NoReportFile } from '../errors';

function getFile(fileName: string): string {
  if (FS.existsSync(fileName)) {
    return FS.readFileSync(fileName, { encoding: 'utf-8' });
  } else {
    throw new NoReportFile(fileName);
  }
}

function parseSarifReport(fileName: string, fileContent: string): object {
  try {
    return JSON.parse(fileContent);
  } catch (e) {
    throw new InvalidJsonContent(fileName);
  }
}

export function getSarif(fileName: string): SchemaV210 {
  const fileTextContent = getFile(fileName);
  const fileContent = parseSarifReport(fileName, fileTextContent);
  try {
    return <SchemaV210>fileContent;
  } catch (e) {
    throw new InvalidSarifFormat(fileName);
  }
}
