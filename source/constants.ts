'use strict';

import * as Core from '@actions/core';
import * as GitHub from '@actions/github';
import { NoRequiredImport } from './errors';

function getInput(inputName: string, required: boolean): string {
  try {
    return Core.getInput(inputName, { required });
  } catch (e) {
    throw new NoRequiredImport(inputName);
  }
}

function getBooleanInput(inputName: string): boolean {
  try {
    return Core.getBooleanInput(inputName, { required: true });
  } catch (e) {
    throw new NoRequiredImport(inputName);
  }
}

function clearFileNames(files: string[]): string[] {
  for (let i = 0; i < files.length; i++) {
    if (files[i].indexOf('/') === 0) {
      files[i] = files[i].substring(1);
      continue;
    }
    if (files[i].indexOf('./') === 0) {
      files[i] = files[i].substring(2);
    }
  }
  return files;
}

interface Constants {
  input: {
    fileName: string;
    isAnnotateOnlyChangedFiles: boolean;
    changedFiles: string[];
  };
  dirname: string;
  repo: {
    owner: string;
    repo: string;
    prNumber: number;
    token: string;
    headSha: string;
  };
}

function setConstants(): Constants {
  const isAnnotateOnlyChangedFiles = getBooleanInput('annotateOnlyChangedFiles');
  const changedFiles = getInput('changedFiles', isAnnotateOnlyChangedFiles);
  const pullRequest = GitHub.context.payload.pull_request;

  Core.info(`Pull Request: ${JSON.stringify(pullRequest)}`);

  return {
    input: {
      fileName: getInput('fileName', true),
      isAnnotateOnlyChangedFiles,
      changedFiles: !!changedFiles ? clearFileNames(changedFiles.split(' ')) : [],
    },
    dirname: process.env.GITHUB_WORKSPACE || __dirname,
    repo: {
      owner: GitHub.context.repo.owner,
      repo: GitHub.context.repo.repo,
      prNumber: pullRequest?.number || -1,
      token: getInput('token', true),
      headSha: pullRequest ? pullRequest.head.sha : GitHub.context.sha,
    },
  };
}

const constants: Constants = setConstants();
Core.info(`Inputs: ${JSON.stringify(constants)}`);

export default constants;
