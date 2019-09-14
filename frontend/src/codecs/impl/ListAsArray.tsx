import React from 'react';
import Codec, { TCellProps, TValidationResult } from '../codec';

export default class ListAsArray<T> extends Codec<Array<T>, null> {
    constructor(public elementCodec: Codec<T, any>) {
        super();
        this.slug = `ListAsArray_${elementCodec.slug}`;
    }
    readonly slug: string;
    readonly ordered: boolean | '+' | '-' = false;

    readonly cellComponent = ListAsArrayCell;

    _filterViewerComponent = null;
    _filterEditorComponent = null;

    parseFilterValue(value: string | null) {
        return null;
    }

    cleanFilterValue(value: null, lastValue?: string): TValidationResult {
        return { valid: false, message: 'Filtering for MatrixAsList not supported'};
    }
}

class ListAsArrayCell<T> extends React.Component<TCellProps<ListAsArray<T>, Array<T>, null>> {
    render() {
        const { codec, value } = this.props;
        if (value === null) return null;

        const Cell = codec.elementCodec.cellComponent;
        // TODO: hack
        const separator = (i: number) => (i < value.length-1 ? ", " : "")
        
        return <>[
            {value.map((x, i) => <><Cell key={i} codec={codec.elementCodec} value={x}/>{separator(i)}</>)}
        ]
        </>;
    }
}
