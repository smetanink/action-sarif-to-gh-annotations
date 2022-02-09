interface Input {
    fileName: string;
    isAnnotateOnlyChangedFiles: boolean;
    changedFiles: string[];
}
export default function (): Input;
export {};
