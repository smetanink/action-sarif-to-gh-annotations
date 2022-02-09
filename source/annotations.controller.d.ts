import { AnnotationProperties } from '@actions/core';

export interface AnnotationSource {
  ruleId: string;
  priority: Priority;
  annotation: {
    title: string;
    file: string;
    startLine: number;
    endLine?: number;
    startColumn?: number;
    endColumn?: number;
  };
  description: string;
}

export type DriverName = 'pmd' | 'eslint';
export type Priority = 'none' | 'note' | 'warning' | 'error';
