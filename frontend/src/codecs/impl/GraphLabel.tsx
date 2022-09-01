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

    toClipboardValue(value: [string, [number]]): string {
        if (value === null) return null

        return `${value[0]}[${value[1].map(n => n.toString()).join(",")}]`
    }
}

class GraphLabelCell extends React.Component<TPresenterProps<GraphLabel, [string, [number]], null>> {
    render() {
        const { value, codec } = this.props
        return <>{codec.toClipboardValue(value)}</>
    }
}
