import React from 'react';
import Codec, { TFilterViewerProps, TFilterEditorProps, TValidationResult, TCellProps } from '../codec';
import { Badge } from "reactstrap";

export default class PolynomialAsSparseArray extends Codec<Array<number>, null> {
    readonly slug: string = "PolynomialAsSparseArray";

    readonly cellComponent = PolynomialAsSparseArrayCell;

    readonly filterViewerComponent = PolynomialAsSparseArrayFilterViewer;
    readonly filterEditorComponent = PolynomialAsSparseArrayFilterEditor;

    defaultFilterValue() {
        return null;
    }

    cleanFilterValue(value: null, lastValue?: string): TValidationResult {
        return { valid: false, message: 'Filtering for PolynomialAsSparseArray not supported'};
    }
}

class PolynomialAsSparseArrayCell extends React.Component<TCellProps<PolynomialAsSparseArray, Array<number>, null>> {
    render() {
        const { value } = this.props;
        if (value === null) return null;

        return value.toString();
    }
}

class PolynomialAsSparseArrayFilterViewer<T> extends React.Component<TFilterViewerProps<PolynomialAsSparseArray, Array<number>, null>> {
    render() {
        const { children } = this.props;
        return <>
            { children }
            <Badge color="danger">Filters for Polynomials are not yet supported</Badge>;
        </>;
    }
}

class PolynomialAsSparseArrayFilterEditor extends React.Component<TFilterEditorProps<PolynomialAsSparseArray, Array<number>, null>> {
    render() {
        const { children } = this.props;

        return (
            <>
                { children }
                <Badge color="danger">Filters for Polynomials are not yet supported</Badge>;
            </>
        )
    }
}