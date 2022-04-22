declare module "react-latex" {
    import React from "react"

    type ErrorHandling = "error" | "warn" | "ignore"
    type StrictHandler = (errorCode: string, errorMsg: string, token: any) => ErrorHandling | undefined
    type TrustHandler = (context: {}) => boolean 

    interface LatexProps {
        children?: string;
        displayMode?: boolean;
        leqno?: boolean;
        fleqn?: boolean;
        throwOnError?: boolean;
        errorColor?: string;
        macros?: {[name: string]: string}
        minRuleThickness?: number;
        colorIsTextColor?: boolean;
        maxSize?: number;
        maxExpand?: number;
        strict?: boolean | ErrorHandling | StrictHandler,
        trust?: boolean | TrustHandler;
    }
    export default class LaTeX extends React.Component<LatexProps> {}
}