import React from "react"
import type { TPresenterProps, TValidationResult } from "../codec"
import Codec from "../codec"

export default class StandardJSON extends Codec<any, null> {
    readonly slug: string = "StandardJSON"
    readonly ordered: boolean | "+" | "-" = false

    readonly cellComponent = StandardJSONCell

    _filterViewerComponent = null
    _filterEditorComponent = null

    parseFilterValue(value: string | null) {
        return null
    }

    cleanFilterValue(value: null, lastValue?: string): TValidationResult {
        return { valid: false }
    }

    toClipboardValue(value: any): string | null {
        return JSON.stringify(value)
    }
}

class StandardJSONCell extends React.Component<TPresenterProps<StandardJSON, any, null>> {
    render() {
        const { value } = this.props
        if (value === null) return null
        
        
        return JSON.stringify(value)
    }
}
