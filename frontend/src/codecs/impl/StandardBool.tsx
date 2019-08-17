import React from 'react';
import Codec, { TFilterViewerProps, TFilterEditorProps, TValidationResult, TCellProps } from '../codec';
import { ButtonGroup, Button } from "reactstrap";
import styles from './StandardBool.module.css';

export default class StandardBool extends Codec<boolean, boolean> {
    readonly slug: string = "StandardBool";

    readonly cellComponent = StandardBoolCell;

    readonly filterViewerComponent = StandardBoolFilterViewer;
    readonly filterEditorComponent = StandardBoolFilterEditor;

    defaultFilterValue() {
        return true;
    }

    cleanFilterValue(value: boolean, lastValue?: string): TValidationResult {
        return { valid: true, value: `=${value}` };
    }
}

class StandardBoolCell extends React.Component<TCellProps<StandardBool, boolean, boolean>> {
    render() {
        const { value } = this.props;
        if (value === null) return null;

        return value.toString();
    }
}

class StandardBoolFilterViewer extends React.Component<TFilterViewerProps<StandardBool, boolean, boolean>> {
    render() {
        const { value, children } = this.props;
        return <>
            { !value && "not "}
            { children }
        </>;
    }
}

class StandardBoolFilterEditor extends React.Component<TFilterEditorProps<StandardBool, boolean, boolean>> {
    private setValueTrue = () => {
        this.props.onChange(true);
    }

    private setValueFalse = () => {
        this.props.onChange(false);
    }
    
    render() {
        const { value, children } = this.props;

        return (
            <>
                { children }
                <ButtonGroup sm className={styles.StandardBoolFilter}>
                    <Button
                        disabled={value}
                        onClick={this.setValueTrue}>True</Button>
                    <Button
                        disabled={!value}
                        onClick={this.setValueFalse}>False</Button>
                </ButtonGroup>
            </>
        )
    }
}