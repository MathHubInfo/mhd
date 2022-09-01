import React from "react"
import type { TPresenterProps, TValidationResult } from "../codec"
import Codec from "../codec"
import { chunkArray } from "../../utils"
import LaTeX from "react-latex"

export default class FactorizationAsSparseArray extends Codec<Array<number>, null> {
    readonly slug: string = "FactorizationAsSparseArray"

    readonly cellComponent = FactorizationAsSparseArrayCell
    readonly ordered: boolean = false

    _filterViewerComponent = null
    _filterEditorComponent = null

    parseFilterValue(value: string | null) {
        return null
    }

    cleanFilterValue(value: null, lastValue?: string): TValidationResult {
        return { valid: false, message: "Filtering for FactorizationAsSparseArray not supported" }
    }

    toClipboardValue(value: Array<number>) : string | null {
        if (value === null) return null
        
        return chunkArray(value, 2).map(
            ([factor, exp], i) => {
                if (factor === 0) return ""
                if (value.length == 2 && exp == 1)
                    return factor.toString()
                return `(${factor}^${exp})`
            }
        ).join("")
    }
}

class FactorizationAsSparseArrayCell extends React.Component<TPresenterProps<FactorizationAsSparseArray, Array<number>, null>> {
    render() {
        const { value } = this.props
        if (value === null) return null
        
        const values = chunkArray(value, 2).map(
            ([factor, exp], i) => {
                if (factor === 0) return ""
                
                // hide exponential if there is only a single factor with exponent 1
                const showExp = !(value.length == 2 && exp == 1)

                // show a times sign for everything except the first factor
                const showTimes = exp > 0 && i > 0

                return `${showTimes ? "*" : ""}{${factor}} ${showExp ? `^{${exp}}` : ""}`
            }
        )
        return <LaTeX>{`$${values.join("")}$`}</LaTeX>
    }
}
