'use strict';

import * as Core from '@actions/core';
import {
  StaticAnalysisResultsFormatSARIFVersion210Rtm4JSONSchema as SchemaV210,
  ReportingDescriptor as Rule,
  Result,
} from './sarif/sarif-schema-2.1.0';
import { InvalidSarifViolationData } from './errors';
import AnnotationsController from './annotations.controller';
import { AnnotationSource } from './annotations.controller.d';

function resultProcessor(driverName: string, rules: Rule[], results: Result[]): AnnotationSource[] {
  const helper = new AnnotationsController(driverName, rules, results);

  const annotations: AnnotationSource[] = [];

  for (let index = 0; index < results.length; index++) {
    // Get Annotation data
    const ann: AnnotationSource[] = helper.getAnnotationSources(index);
    annotations.push(...ann);
  }

  return annotations;
}

function printAnnotations(annotations: AnnotationSource[]): void {
  Core.startGroup('Violations');
  for (const annotation of annotations) {
    let operation;
    switch (annotation.priority) {
      case 'error':
        operation = Core.error;
        break;
      case 'warning':
        operation = Core.warning;
        break;
      case 'note':
        operation = Core.notice;
        break;
      case 'none':
      default:
        continue;
    }
    operation(annotation.description, annotation.annotation);
  }
  Core.endGroup();
}

export function createAnnotations(sarif: SchemaV210): void {
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

  // Annotate violations
  const annotations: AnnotationSource[] = resultProcessor(driverName, rules, results);
  printAnnotations(annotations);
}
