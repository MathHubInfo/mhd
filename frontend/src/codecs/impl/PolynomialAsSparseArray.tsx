import React from "react"
import type { TPresenterProps, TValidationResult } from "../codec"
import Codec from "../codec"
import { chunkArray } from "../../utils"

/**
 * Represents a polynomial a1 * x^b1 + a2 * x^b2 + ... as an array [..., b2, a2, b1, a1]
 */
export default class PolynomialAsSparseArray extends Codec<Array<number>, null> {
    readonly slug: string = "PolynomialAsSparseArray"

    readonly cellComponent = PolynomialAsSparseArrayCell
    readonly ordered: boolean = false

    _filterViewerComponent = null
    _filterEditorComponent = null

    parseFilterValue(value: string | null) {
        return null
    }

    cleanFilterValue(value: null, lastValue?: string): TValidationResult {
        return { valid: false, message: "Filtering for PolynomialAsSparseArray not supported" }
    }
}

class PolynomialAsSparseArrayCell extends React.Component<TPresenterProps<PolynomialAsSparseArray, Array<number>, null>> {
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
                    factor = "+" + factor

                if (exp === 0) return <span key={i}>{factor}</span>
                if (exp === 1) return <span key={i}>{factor} x</span>
                else return <span key={i}>{factor} x<sup>{exp}</sup></span>
            }
        )
    }
}
