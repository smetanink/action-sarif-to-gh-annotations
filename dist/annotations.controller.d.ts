import { ReportingDescriptor as Rule, Result } from './sarif/sarif-schema-2.1.0';
import { AnnotationSource } from './annotations.controller.d';
export default class {
    private readonly rules;
    private readonly results;
    private readonly driverName;
    constructor(driverName: string, rules: Rule[], results: Result[]);
    getAnnotationSources(index: number): AnnotationSource[];
    private getPmdPriority;
    private clearFileName;
    private getPmdDescription;
    private getAnnotation;
}
