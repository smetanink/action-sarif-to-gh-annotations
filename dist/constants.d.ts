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
declare const constants: Constants;
export default constants;
