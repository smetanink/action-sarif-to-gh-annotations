'use strict';

import { ReportingDescriptor as Rule, Result } from './sarif/sarif-schema-2.1.0';
import { AnnotationSource, DriverName, Priority } from './annotations.controller.d';
import { InvalidSarifDriver } from './errors';

export default class {
  private readonly rules: Rule[];
  private readonly results: Result[];
  private readonly driverName: DriverName;

  constructor(driverName: string, rules: Rule[], results: Result[]) {
    this.rules = rules || [];
    this.results = results || [];
    try {
      this.driverName = driverName.toLowerCase() as DriverName;
    } catch (e) {
      throw new InvalidSarifDriver(driverName);
    }
  }

  getAnnotationSources(index: number): AnnotationSource[] {
    return this.getAnnotation(index);
  }

  private getPmdPriority(priority: number): Priority {
    switch (priority) {
      case 1:
        return 'error';
      case 2:
        return 'error';
      case 3:
        return 'warning';
      case 4:
        return 'warning';
      default:
        return 'note';
    }
  }

  private getPmdDescription(rule: Rule): string {
    if (!rule.fullDescription?.text) {
      return '';
    }

    const lines: string[] = rule.fullDescription.text.split(/\n|\r\n/);

    // remove empty first line
    if (lines.length > 1 && lines[0] === '') {
      lines.splice(0, 1);
    }

    // remove empty last line
    if (lines.length > 0 && lines[lines.length - 1].trim() === '') {
      lines.splice(lines.length - 1, 1);
    }

    // trim other lines
    lines.forEach((line) => line.trim());

    let description = lines.join('\n');
    description += `\n\n${rule.helpUri?.trim()}`;
    return description;
  }

  private getAnnotation(index: number): AnnotationSource[] {
    const result: Result = this.results[index];
    const annotations: AnnotationSource[] = [];

    if (result.ruleIndex === undefined) {
      return [];
    }

    const rule: Rule = this.rules[result.ruleIndex];

    if (!result.locations || result.locations.length == 0) {
      return [];
    }

    const priority: Priority =
      this.driverName === 'pmd'
        ? // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          // I don't know why, but PMD use incorrect schema (rule.properties.priority) there...
          this.getPmdPriority(rule.properties?.priority || 5)
        : result.level || 'none';

    for (const location of result.locations) {
      if (
        !result.message?.text ||
        !location.physicalLocation?.artifactLocation?.uri ||
        !location.physicalLocation?.region?.startLine
      ) {
        continue;
      }

      const annotation: AnnotationSource = {
        ruleId: rule.id,
        priority,
        annotation: {
          title: result.message.text,
          file: location.physicalLocation.artifactLocation.uri,
          startLine: location.physicalLocation.region.startLine,
          startColumn: location.physicalLocation.region.startColumn || 0,
          endLine: location.physicalLocation.region.endLine || undefined,
          endColumn: location.physicalLocation.region.endColumn || undefined,
        },
        description:
          this.driverName === 'pmd' ? this.getPmdDescription(rule) : rule.helpUri?.trim() || '',
      };
      annotations.push(annotation);
    }

    return annotations;
  }
}
