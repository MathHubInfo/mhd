import React from "react"
import type { TValidationResult, TPresenterProps } from "../codec"
import Codec from "../codec"

export default class GraphLabel extends Codec<[string, [number]], null> {
    readonly slug: string = "GraphLabel"
    readonly ordered: boolean | "+" | "-" = true

    readonly cellComponent = GraphLabelCell

    _filterViewerComponent = null
    _filterEditorComponent = null

    parseFilterValue(value: string | null) {
        return null
    }

    cleanFilterValue(value: null, lastValue?: string): TValidationResult {
        return { valid: false, message: "Filtering for GraphLabel not supported" }
    }
}

class GraphLabelCell extends React.Component<TPresenterProps<GraphLabel, [string, [number]], null>> {
    render() {
        const { value } = this.props
        if (value === null) return null
        
        const [label, params] = value

        return <>{label}[{params.map(p => p.toString()).join(", ")}]</>
    }
}
