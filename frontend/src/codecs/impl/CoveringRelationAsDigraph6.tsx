import React from "react"
import type { TValidationResult, TCellProps } from "../codec"
import Codec from "../codec"

export default class CoveringRelationAsDigraph6 extends Codec<string, null> {
    readonly slug: string = "CoveringRelationAsDigraph6"
    readonly ordered: boolean | "+" | "-" = false

    readonly cellComponent = CoveringRelationAsDigraph6Cell

    readonly _filterViewerComponent = null
    readonly _filterEditorComponent = null

    parseFilterValue(value: string | null) {
        return null
    }

    cleanFilterValue(value: null, lastValue?: string): TValidationResult {
        return { valid: false }
    }
}

class CoveringRelationAsDigraph6Cell extends React.Component<TCellProps<CoveringRelationAsDigraph6, string, null>> {
    render() {
        // const { value } = this.props;
        return "(Hasse Diagram)"
    }
}
