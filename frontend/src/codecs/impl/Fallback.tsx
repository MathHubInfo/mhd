import React from 'react';
import { Badge } from "reactstrap";
import Codec, { TValidationResult } from '../codec';

export default class Fallback extends Codec<any, null> {
    readonly slug: string = "Fallback";

    readonly cellComponent = FallbackElement;

    readonly filterViewerComponent = FallbackElement;
    readonly filterEditorComponent = FallbackElement;

    defaultFilterValue() {
        return null;
    }

    cleanFilterValue(value: null, lastValue?: string): TValidationResult {
        return { valid: false, message: 'Unknown codec' };
    }
}

class FallbackElement extends React.Component<any> {
    render() {
        const { children } = this.props;
        
        return <>
            { children }
            <Badge color="danger">Unknown Codec</Badge>
        </>
    }
}
