import { ReportingDescriptor as Rule, Result } from './sarif/sarif-schema-2.1.0';
import { AnnotationSource } from './annotations.controller.d';
export declare class AnnotationBuilder {
    private readonly rules;
    private readonly results;
    private readonly isAnnotateOnlyChangedFiles;
    private readonly changedFiles;
    private readonly driverName;
    constructor(driverName: string, rules: Rule[], results: Result[], isAnnotateOnlyChangedFiles: boolean, changedFiles?: string[]);
    getAnnotationSources(): AnnotationSource[];
    private getAnnotation;
}
export declare class AnnotationPusher {
    private readonly annotations;
    private readonly driverName;
    private readonly chunkSize;
    private violationCounter;
    constructor(driverName: string, annotations: AnnotationSource[]);
    private convertAnnotationsToApi;
    pushViolationsAsCheck(): Promise<void>;
    pushViolationsAsAnnotations(): void;
    specifyOutputs(): void;
}
