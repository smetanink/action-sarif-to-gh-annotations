'use strict';

import * as Core from '@actions/core';
import * as GitHub from '@actions/github';

import Constants from './constants';
import { ReportingDescriptor as Rule, Result } from './sarif/schemas/sarif-schema-2.1.0';
import {
  AnnotationSource,
  ApiAnnotation,
  DriverName,
  Priority,
  Conclusion,
} from './annotations.controller.d';
import { InvalidSarifDriver } from './errors';

// Setup GitHub API connector
const octokit = GitHub.getOctokit(Constants.repo.token);

// Setup work directory name
let dirname = process.env.GITHUB_WORKSPACE || '';
if (dirname.indexOf('/') === 0) {
  dirname = dirname.substring(1);
}

function getPmdPriority(priority: number): Priority {
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

function clearFileName(filePath: string): string {
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

function getPmdDescription(rule: Rule): string {
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

export class AnnotationBuilder {
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
    this.rules = rules || [];
    this.results = results || [];
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
          getPmdPriority(rule.properties?.priority || 5)
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
          file: clearFileName(location.physicalLocation.artifactLocation.uri),
          startLine: location.physicalLocation.region.startLine,
          startColumn: location.physicalLocation.region.startColumn || 0,
          endLine: location.physicalLocation.region.endLine || undefined,
          endColumn: location.physicalLocation.region.endColumn || undefined,
        },
        description:
          this.driverName === 'pmd' ? getPmdDescription(rule) : rule.helpUri?.trim() || '',
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
}

async function createGitHubCheck(driverName: DriverName): Promise<number> {
  const checkData = await octokit.rest.checks.create({
    owner: Constants.repo.owner,
    repo: Constants.repo.repo,
    started_at: new Date().toISOString(),
    head_sha: Constants.repo.headSha,
    status: 'in_progress',
    name: `${driverName} at ${Constants.repo.headSha}`,
  });

  Core.debug(`New GitHub Check: ${JSON.stringify(checkData)}`);

  return checkData.data.id;
}

async function updateGitHubCheck(
  checkId: number,
  driverName: DriverName,
  summary: string,
  annotations: ApiAnnotation[],
): Promise<void> {
  const checkData = await octokit.rest.checks.update({
    owner: Constants.repo.owner,
    repo: Constants.repo.repo,
    check_run_id: checkId,
    status: 'in_progress',
    output: {
      title: `${driverName} at ${Constants.repo.headSha}`,
      summary,
      annotations,
    },
  });

  Core.debug(`Update GitHub check: ${JSON.stringify(checkData)}`);
}

async function closeGitHubCheck(
  checkId: number,
  driverName: DriverName,
  summary: string,
  conclusion: Conclusion,
): Promise<void> {
  const checkData = await octokit.rest.checks.update({
    owner: Constants.repo.owner,
    repo: Constants.repo.repo,
    completed_at: new Date().toISOString(),
    check_run_id: checkId,
    status: 'completed',
    conclusion,
    output: {
      title: `${driverName} at ${Constants.repo.headSha}`,
      summary,
    },
  });

  Core.debug(`Finish GitHub check: ${JSON.stringify(checkData)}`);
}

export class AnnotationPusher {
  private readonly annotations: AnnotationSource[];
  private readonly driverName: DriverName;
  private readonly chunkSize: number = 50;
  private violationCounter = {
    errors: 0,
    warnings: 0,
    notices: 0,
  };

  constructor(driverName: string, annotations: AnnotationSource[]) {
    this.annotations = annotations;
    try {
      this.driverName = driverName.toLowerCase() as DriverName;
    } catch (e) {
      throw new InvalidSarifDriver(driverName);
    }
  }

  private convertAnnotationsToApi(annotations: AnnotationSource[]): ApiAnnotation[] {
    const apiAnnotations: ApiAnnotation[] = [];
    for (const annotation of annotations) {
      apiAnnotations.push({
        path: annotation.annotation.file,
        start_line: annotation.annotation.startLine,
        end_line: annotation.annotation.endLine || annotation.annotation.startLine,
        annotation_level:
          annotation.priority === 'error'
            ? 'error'
            : annotation.priority === 'warning'
            ? 'warning'
            : 'notice',
        message: annotation.description,
        title: annotation.annotation.title,
      });
      switch (annotation.priority) {
        case 'error':
          this.violationCounter.errors++;
          break;
        case 'warning':
          this.violationCounter.warnings++;
          break;
        case 'note':
          this.violationCounter.notices++;
          break;
        case 'none':
        default:
      }
    }
    return apiAnnotations;
  }

  async pushViolationsAsCheck(): Promise<void> {
    let apiError: string | undefined;
    // In case of error nothing to do there. Error must be caught on top level function
    const checkId: number = await createGitHubCheck(this.driverName);

    try {
      const totalChunks = Math.floor(this.annotations.length / this.chunkSize) + 1;
      for (let i = 0; i < totalChunks; i++) {
        const summary = `Found ${
          this.annotations.length
        } violations, processing chunk ${1} of ${totalChunks}...`;
        Core.info(summary);
        await updateGitHubCheck(
          checkId,
          this.driverName,
          summary,
          this.convertAnnotationsToApi(
            this.annotations.slice(this.chunkSize * i, this.chunkSize * (i + 1)),
          ),
        );
      }
    } catch (e) {
      // We have close GitHub check so continue there
      apiError = (e as Error).message;
    }

    const summary = `# ${this.driverName.toUpperCase()} run results:\n- Errors: __${
      this.violationCounter.errors
    }__\n- Warnings: __${this.violationCounter.warnings}__\n- Notices: __${
      this.violationCounter.notices
    }__`;
    await closeGitHubCheck(
      checkId,
      this.driverName,
      summary,
      this.violationCounter.errors + this.violationCounter.warnings === 0 ? 'success' : 'failure',
    );

    // Return error if any
    if (apiError) {
      throw new Error(apiError);
    }
  }

  pushViolationsAsAnnotations(): void {
    Core.startGroup('Violations');
    for (const annotation of this.annotations) {
      Core.info(
        `${annotation.annotation.file}:${annotation.annotation.startLine} '${annotation.annotation.title}'`,
      );

      switch (annotation.priority) {
        case 'error':
          Core.error(annotation.description, annotation.annotation);
          this.violationCounter.errors++;
          break;
        case 'warning':
          Core.warning(annotation.description, annotation.annotation);
          this.violationCounter.warnings++;
          break;
        case 'note':
          Core.notice(annotation.description, annotation.annotation);
          this.violationCounter.notices++;
          break;
        case 'none':
        default:
      }
    }
    Core.endGroup();
  }

  specifyOutputs(): void {
    Core.setOutput('violation_error_number', this.violationCounter.errors);
    Core.setOutput('violation_warning_number', this.violationCounter.warnings);
    Core.setOutput('violation_notice_number', this.violationCounter.notices);
    Core.setOutput(
      'violation_total_number',
      this.violationCounter.errors + this.violationCounter.warnings + this.violationCounter.notices,
    );
  }
}
