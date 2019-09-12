import React from 'react';
import Codec, { TValidationResult, TCellProps } from '../codec';

export default class StandardString extends Codec<string, null> {
    readonly slug: string = "StandardString";

    readonly cellComponent = StandardStringCell;

    readonly _filterViewerComponent = null;
    readonly _filterEditorComponent = null;

    parseFilterValue(value: string | null) {
        return null;
    }

    cleanFilterValue(value: null, lastValue?: string): TValidationResult {
        return { valid: false };
    }
}

class StandardStringCell extends React.Component<TCellProps<StandardString, string, null>> {
    render() {
        const { value } = this.props;
        return value;
    }
}
