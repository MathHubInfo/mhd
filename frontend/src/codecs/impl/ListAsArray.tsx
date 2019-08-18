import React from 'react';
import Codec, { TFilterViewerProps, TFilterEditorProps, TValidationResult, TCellProps } from '../codec';
import { Badge } from "reactstrap";

export default class ListAsArray<T> extends Codec<Array<T>, null> {
    constructor(public elementCodec: Codec<T, any>) {
        super();
        this.slug = `ListAsArray_${elementCodec.slug}`;
    }
    readonly slug: string;

    readonly cellComponent = ListAsArrayCell;

    readonly filterViewerComponent = ListAsArrayFilterViewer;
    readonly filterEditorComponent = ListAsArrayFilterEditor;

    defaultFilterValue() {
        return null;
    }

    cleanFilterValue(value: null, lastValue?: string): TValidationResult {
        return { valid: false, message: 'Filtering for MatrixAsList not supported'};
    }
}

class ListAsArrayCell<T> extends React.Component<TCellProps<ListAsArray<T>, Array<T>, null>> {
    render() {
        const { value } = this.props;
        if (value === null) return null;
        

        // TODO: for now
        return <>
            {JSON.stringify(value)}
        </>;
    }
}

class ListAsArrayFilterViewer<T> extends React.Component<TFilterViewerProps<ListAsArray<T>, Array<T>, null>> {
    render() {
        const { children } = this.props;
        return <>
            { children }
            <Badge color="danger">Filters for Lists are not yet supported</Badge>
        </>;
    }
}

class ListAsArrayFilterEditor<T> extends React.Component<TFilterEditorProps<ListAsArray<T>, Array<T>, null>> {
    render() {
        const { children } = this.props;

        return (
            <>
                { children }
                <Badge color="danger">Filters for Lists are not yet supported</Badge>
            </>
        )
    }
}