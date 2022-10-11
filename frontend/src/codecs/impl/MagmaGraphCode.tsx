import React from "react"
import type CodecExporter from "../../exporters/codecs"
import { MagmaGraphCodeExporter } from "../../exporters/codecs/MagmaGraphCode"
import type { TValidationResult, TPresenterProps } from "../codec"
import Codec from "../codec"

export default class MagmaGraphCode extends Codec<string, null> {
    readonly slug: string = "MagmaGraphCode"
    readonly ordered: boolean | "+" | "-" = false
    readonly exporters: CodecExporter<string>[] = [new MagmaGraphCodeExporter()]

    readonly cellComponent = MagmaGraphCodeCell

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

class MagmaGraphCodeCell extends React.Component<TPresenterProps<MagmaGraphCode, string, null>> {
    render() {
        const { value } = this.props
        return <code>{value}</code>
    }
}
