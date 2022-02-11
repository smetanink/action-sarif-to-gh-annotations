'use strict';

import * as Core from '@actions/core';
import * as GitHub from '@actions/github';

import Constants from '../constants';
import { AnnotationSource, ApiAnnotation, DriverName } from './annotation.types';
import { InvalidSarifDriver } from '../errors';

// Setup GitHub API connector
const octokit = GitHub.getOctokit(Constants.repo.token);

export default class Pusher {
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

  async pushViolationsAsCheck(): Promise<void> {
    let apiError: string | undefined;

    // Create new GitHub Check
    // In case of error nothing to do there. Error must be caught on top level function
    const checkId: number = await this.createGitHubCheck();

    // Add Annotations to GitHub Check
    try {
      const totalChunks = Math.floor(this.annotations.length / this.chunkSize) + 1;

      for (let i = 0; i < totalChunks; i++) {
        const summary = Pusher.buildChunkSummary(this.annotations.length, i, totalChunks);
        Core.info(summary);
        await this.updateGitHubCheck(checkId, summary, i);
      }
    } catch (e) {
      // We have close GitHub check so continue there
      apiError = (e as Error).message;
    }

    // Close GitHub Check
    // In case of error nothing to do there. Error must be caught on top level function
    await this.closeGitHubCheck(checkId);

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

  private async createGitHubCheck(): Promise<number> {
    const checkData = await octokit.rest.checks.create({
      owner: Constants.repo.owner,
      repo: Constants.repo.repo,
      started_at: new Date().toISOString(),
      head_sha: Constants.repo.headSha,
      status: 'in_progress',
      name: `${this.driverName} at ${Constants.repo.headSha}`,
    });

    Core.debug(`New GitHub Check: ${JSON.stringify(checkData)}`);

    return checkData.data.id;
  }

  private async updateGitHubCheck(
    checkId: number,
    summary: string,
    chunkNumber: number,
  ): Promise<void> {
    const checkData = await octokit.rest.checks.update({
      owner: Constants.repo.owner,
      repo: Constants.repo.repo,
      check_run_id: checkId,
      status: 'in_progress',
      output: {
        title: `${this.driverName} at ${Constants.repo.headSha}`,
        summary,
        annotations: this.convertAnnotationsToApi(chunkNumber),
      },
    });

    Core.debug(`Update GitHub check: ${JSON.stringify(checkData)}`);
  }

  private async closeGitHubCheck(checkId: number): Promise<void> {
    const checkData = await octokit.rest.checks.update({
      owner: Constants.repo.owner,
      repo: Constants.repo.repo,
      completed_at: new Date().toISOString(),
      check_run_id: checkId,
      status: 'completed',
      conclusion:
        this.violationCounter.errors + this.violationCounter.warnings === 0 ? 'success' : 'failure',
      output: {
        title: `${this.driverName} at ${Constants.repo.headSha}`,
        summary: this.buildResultSummary(),
      },
    });

    Core.debug(`Finish GitHub check: ${JSON.stringify(checkData)}`);
  }

  private convertAnnotationsToApi(chunkNumber: number): ApiAnnotation[] {
    const apiAnnotations: ApiAnnotation[] = [];
    for (const annotation of this.annotations.slice(
      this.chunkSize * chunkNumber,
      this.chunkSize * (chunkNumber + 1),
    )) {
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

  private static buildChunkSummary(violations: number, chunk: number, totalChunks: number): string {
    return `Found ${violations} violations, processing chunk ${chunk} of ${totalChunks}...`;
  }

  private buildResultSummary(): string {
    return (
      `# ${this.driverName.toUpperCase()} run results:\n` +
      `- Errors: __${this.violationCounter.errors}__\n` +
      `- Warnings: __${this.violationCounter.warnings}__\n` +
      `- Notices: __${this.violationCounter.notices}__`
    );
  }
}
