import React from 'react';
import Codec, { TFilterViewerProps, TFilterEditorProps, TValidationResult, TCellProps } from '../codec';
import { Badge } from "reactstrap";

export default class MatrixAsList<T> extends Codec<Array<T>, null> {
    constructor(public elementCodec: Codec<T, any>, public rows: number, public columns: number) {
        super();
        this.slug = `MatrixAsList_${elementCodec.slug}_${rows}_${columns}`;
    }
    readonly slug: string;

    readonly cellComponent = MatrixAsListCell;

    readonly filterViewerComponent = MatrixAsListFilterViewer;
    readonly filterEditorComponent = MatrixAsListFilterEditor;

    defaultFilterValue() {
        return null;
    }

    cleanFilterValue(value: null, lastValue?: string): TValidationResult {
        return { valid: false, message: 'Filtering for MatrixAsList not supported'};
    }
}

class MatrixAsListCell<T> extends React.Component<TCellProps<MatrixAsList<T>, Array<T>, null>> {
    render() {
        const { value, codec } = this.props;
        if (value === null) return null;
        

        // for now
        return <>
            Matrix {codec.rows}x{codec.columns}
            <br />
            {JSON.stringify(value)}
        </>;
    }
}

class MatrixAsListFilterViewer<T> extends React.Component<TFilterViewerProps<MatrixAsList<T>, Array<T>, null>> {
    render() {
        const { children } = this.props;
        return <>
            { children }
            <Badge color="danger">Filters for Matrices are not yet supported</Badge>;
        </>;
    }
}

class MatrixAsListFilterEditor<T> extends React.Component<TFilterEditorProps<MatrixAsList<T>, Array<T>, null>> {
    render() {
        const { children } = this.props;

        return (
            <>
                { children }
                <Badge color="danger">Filters for Matrices are not yet supported</Badge>;
            </>
        )
    }
}