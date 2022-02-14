'use strict';

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

export interface ApiAnnotation {
  path: string;
  start_line: number;
  end_line: number;
  start_column?: number;
  end_column?: number;
  annotation_level: AnnotationLevel;
  message: string;
  title?: string;
}

export type DriverName = 'pmd' | 'eslint';
export type Priority = 'notice' | 'warning' | 'error';
export type AnnotationLevel = 'notice' | 'warning' | 'failure';
