import React from "react"
import type { TPresenterProps, TValidationResult } from "../codec"
import Codec from "../codec"
import { chunkArray } from "../../utils"

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
}

class FactorizationAsSparseArrayCell extends React.Component<TPresenterProps<FactorizationAsSparseArray, Array<number>, null>> {
    render() {
        const { value } = this.props
        if (value === null) return null
        
        
        return chunkArray(value, 2).reverse().map(
            (a, i) => {
                let factor = a[1].toString()
                var exp = a[0]

                if (factor === "0")
                    return null
                    
                if (factor === "1")
                    factor = ""
                
                if (a[1] > 0 && i > 0)
                    factor = "·" + factor

                if (exp === 0) return null
                if (exp === 1) return <span key={i}>{factor}</span>
                else return <span key={i}>{factor} x<sup>{exp}</sup></span>
            }
        )
    }
}
