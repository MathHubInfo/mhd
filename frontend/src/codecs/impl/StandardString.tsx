import React from "react"
import type { TValidationResult, TPresenterProps } from "../codec"
import Codec from "../codec"

export default class StandardString extends Codec<string, null> {
    readonly slug: string = "StandardString"
    readonly ordered: boolean | "+" | "-" = true

    readonly cellComponent = StandardStringCell

    readonly _filterViewerComponent = null
    readonly _filterEditorComponent = null

    parseFilterValue(value: string | null) {
        return null
    }

    cleanFilterValue(value: null, lastValue?: string): TValidationResult {
        return { valid: false }
    }

    toClipboardValue(value: string): string | null {
        return value.toString()
    }
}

class StandardStringCell extends React.Component<TPresenterProps<StandardString, string, null>> {
    render() {
        const { value } = this.props
        return value
    }
}
