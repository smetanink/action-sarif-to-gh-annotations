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
    annotation_level: Priority;
    message: string;
    title?: string;
}
export declare type DriverName = 'pmd' | 'eslint';
export declare type Priority = 'notice' | 'warning' | 'error';
