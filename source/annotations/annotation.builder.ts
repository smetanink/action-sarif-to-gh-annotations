'use strict';

import * as Core from '@actions/core';

import Constants from '../constants';
import { ReportingDescriptor as Rule, Result } from '../sarif/schemas/sarif-schema-2.1.0';
import { AnnotationSource, DriverName, Priority } from './annotation.types';
import { InvalidSarifDriver } from '../errors';

// Setup work directory name
let dirname: string = Constants.dirname;
if (dirname.indexOf('/') === 0) {
  dirname = dirname.substring(1);
}

export default class Builder {
  private readonly rules: Rule[];
  private readonly results: Result[];
  private readonly isAnnotateOnlyChangedFiles: boolean;
  private readonly changedFiles: string[];
  private readonly driverName: DriverName;

  constructor(
    driverName: string,
    rules: Rule[],
    results: Result[],
    isAnnotateOnlyChangedFiles: boolean,
    changedFiles?: string[],
  ) {
    this.rules = rules;
    this.results = results;
    this.isAnnotateOnlyChangedFiles = isAnnotateOnlyChangedFiles;
    this.changedFiles = changedFiles || [];
    try {
      this.driverName = driverName.toLowerCase() as DriverName;
    } catch (e) {
      throw new InvalidSarifDriver(driverName);
    }
  }

  getAnnotationSources(): AnnotationSource[] {
    const annotations: AnnotationSource[] = [];
    Core.startGroup('Omitted Violations');
    for (let index = 0; index < this.results.length; index++) {
      const ann: AnnotationSource[] = this.getAnnotation(index);
      annotations.push(...ann);
    }
    Core.endGroup();
    return annotations;
  }

  private getAnnotation(index: number): AnnotationSource[] {
    const result: Result = this.results[index];
    const annotations: AnnotationSource[] = [];

    // Get rule data
    if (result.ruleIndex === undefined) {
      return annotations;
    }
    const rule: Rule = this.rules[result.ruleIndex];

    // Check if any locations exists
    if (!result.locations || result.locations.length == 0) {
      return annotations;
    }

    // Create annotation for each violation location
    for (const location of result.locations) {
      // Check if Location correct
      if (
        !result.message?.text ||
        !location.physicalLocation?.artifactLocation?.uri ||
        !location.physicalLocation?.region?.startLine
      ) {
        continue;
      }

      const annotation: AnnotationSource = {
        ruleId: rule.id,
        priority: this.getPriority(rule, result),
        annotation: {
          title: result.message.text,
          file: Builder.clearFileName(location.physicalLocation.artifactLocation.uri),
          startLine: location.physicalLocation.region.startLine,
          startColumn: location.physicalLocation.region.startColumn || 0,
          endLine: location.physicalLocation.region.endLine || undefined,
          endColumn: location.physicalLocation.region.endColumn || undefined,
        },
        description: Builder.getDescription(rule),
      };

      // Print log if violation has been omitted or add this in array to further publishing
      if (
        !this.isAnnotateOnlyChangedFiles ||
        this.changedFiles.includes(annotation.annotation.file)
      ) {
        annotations.push(annotation);
      } else {
        Core.info(
          `${annotation.annotation.file}:${annotation.annotation.startLine} '${annotation.annotation.title}' - The file has not changed. Annotation omitted.`,
        );
      }
    }

    return annotations;
  }

  private getPriority(rule: Rule, result: Result): Priority {
    if (this.driverName === 'pmd') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // I don't know why, but PMD use incorrect schema (rule.properties.priority) there...
      switch (rule.properties?.priority || 5) {
        case 1:
        case 2:
          return 'error';
        case 3:
        case 4:
          return 'warning';
        case 5:
        default:
          return 'notice';
      }
    } else {
      // ESLint driver
      return result.level === 'error' ? 'error' : result.level === 'warning' ? 'warning' : 'notice';
    }
  }

  private static clearFileName(filePath: string): string {
    if (filePath.indexOf('file:///') === 0) {
      filePath = filePath.substring('file:///'.length);
    }
    if (dirname && filePath.indexOf(dirname) === 0) {
      filePath = filePath.substring(dirname.length);
    }
    if (filePath.indexOf('/') === 0) {
      filePath = filePath.substring(1);
    }
    return filePath;
  }

  private static getDescription(rule: Rule): string {
    let description = '';

    // Clear full description and add in description if any
    if (rule.fullDescription?.text) {
      const lines: string[] = rule.fullDescription.text.split(/\n|\r\n/);

      // trim all lines
      for (let i = 0; i < lines.length; i++) {
        lines[i] = lines[i].trim();
      }

      // remove empty first line
      if (lines[0] === '') {
        lines.splice(0, 1);
      }

      // remove empty last line
      if (lines.length > 0 && lines[lines.length - 1].trim() === '') {
        lines.splice(lines.length - 1, 1);
      }

      if (lines.length > 0) {
        description = lines.join('\n');
        description += '\n\n';
      }
    }

    // Add help url
    description += `See full rule description at: ${rule.helpUri?.trim()}`;
    return description;
  }
}
