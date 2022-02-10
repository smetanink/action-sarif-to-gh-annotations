'use strict';

import * as Core from '@actions/core';
import Constants from './constants';
import {
  StaticAnalysisResultsFormatSARIFVersion210Rtm4JSONSchema as SchemaV210,
  ReportingDescriptor as Rule,
  Result,
} from './sarif/sarif-schema-2.1.0';
import { InvalidSarifViolationData } from './errors';
import { AnnotationBuilder, AnnotationPusher } from './annotations.controller';
import { AnnotationSource } from './annotations.controller.d';

async function printAnnotations(
  driverName: string,
  annotations: AnnotationSource[],
): Promise<void> {
  const pusher = new AnnotationPusher(driverName, annotations);

  try {
    Core.info('Push violations as GitHub Code Check');
    await pusher.pushViolationsAsCheck();
    Core.info('Push violations as GitHub Code Check - completed');
  } catch (e) {
    Core.info(`Push violations as GitHub Code Check - failed. Reason: ${(e as Error).message}`);
    Core.info('Push violations as GitHub Annotations');
    pusher.pushViolationsAsAnnotations();
  }

  pusher.specifyOutputs();
}

export async function createAnnotations(sarif: SchemaV210): Promise<void> {
  // Check if Sarif not empty
  if (sarif?.runs?.length !== 1) {
    Core.info('There is no scanner runs. Nothing to annotate');
    return;
  }

  // Get scanner results
  const driverName: string = sarif.runs[0].tool?.driver?.name || '';
  const rules: Rule[] = sarif.runs[0].tool?.driver?.rules || [];
  const results: Result[] = sarif.runs[0].results || [];

  // Check scanner results
  if (rules.length === 0 && results.length === 0) {
    Core.info('There is no violations found. Nothing to annotate');
    return;
  } else if (rules.length === 0 || results.length === 0) {
    throw new InvalidSarifViolationData();
  }

  // Prepare violation list
  const builder = new AnnotationBuilder(
    driverName,
    rules,
    results,
    Constants.input.isAnnotateOnlyChangedFiles,
    Constants.input.changedFiles,
  );

  const annotations: AnnotationSource[] = builder.getAnnotationSources();
  if (annotations.length === 0) {
    Core.info('There is no violations to be pushed');
    return;
  }

  await printAnnotations(driverName, annotations);
}
