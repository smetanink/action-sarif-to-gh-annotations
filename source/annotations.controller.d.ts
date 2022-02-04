import { AnnotationProperties } from '@actions/core';

export interface AnnotationSource {
  ruleId: string;
  priority: Priority;
  annotation: AnnotationProperties;
  description: string;
}

export type DriverName = 'pmd' | 'eslint';
export type Priority = 'none' | 'note' | 'warning' | 'error';
