import { ReportingDescriptor as Rule, Result } from '../sarif/schemas/sarif-schema-2.1.0';
import { AnnotationSource } from './annotation.types';
export default class Builder {
    private readonly rules;
    private readonly results;
    private readonly isAnnotateOnlyChangedFiles;
    private readonly changedFiles;
    private readonly driverName;
    constructor(driverName: string, rules: Rule[], results: Result[], isAnnotateOnlyChangedFiles: boolean, changedFiles?: string[]);
    getAnnotationSources(): AnnotationSource[];
    private getAnnotation;
    private getPriority;
    private static clearFileName;
    private static getDescription;
}
