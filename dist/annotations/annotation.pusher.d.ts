import { AnnotationSource } from './annotation.types';
export default class Pusher {
    private readonly annotations;
    private readonly driverName;
    private readonly chunkSize;
    private violationCounter;
    constructor(driverName: string, annotations: AnnotationSource[]);
    pushViolationsAsCheck(): Promise<void>;
    pushViolationsAsAnnotations(): void;
    specifyOutputs(): void;
    private createGitHubCheck;
    private updateGitHubCheck;
    private closeGitHubCheck;
    private convertAnnotationsToApi;
    private static buildChunkSummary;
    private buildResultSummary;
}
