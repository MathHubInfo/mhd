import React from "react"
import type { TCellProps, TValidationResult } from "../codec"
import Codec from "../codec"
import { chunkArray } from "../../utils"
import styles from "./MatrixAsList.module.css"

export default class MatrixAsList<T> extends Codec<Array<T>, null> {
    constructor(public elementCodec: Codec<T, any>, public rows: number, public columns: number) {
        super()
        this.slug = `MatrixAsList_${elementCodec.slug}_${rows}_${columns}`
    }
    readonly slug: string
    readonly ordered: boolean | "+" | "-" = false

    readonly cellComponent = MatrixAsListCell

    _filterViewerComponent = null
    _filterEditorComponent = null

    parseFilterValue(value: string | null) {
        return null
    }

    cleanFilterValue(value: null, lastValue?: string): TValidationResult {
        return { valid: false, message: "Filtering for MatrixAsList not supported" }
    }
}

class MatrixAsListCell<T> extends React.Component<TCellProps<MatrixAsList<T>, Array<T>, null>> {
    render() {
        const { value, codec } = this.props
        if (value === null) return null
        
        return (
            <table className={styles.displayMatrix}>{
                chunkArray(value, codec.columns).map((r, index) =>
                    <tr key={index}>{
                        r.map((e, i) => <td key={index + ":" + i}>{e}</td>)
                    }</tr>
                )
            }</table>
        )
    }
}
