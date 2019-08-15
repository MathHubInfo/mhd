import React, { ChangeEvent, KeyboardEvent } from 'react';
import Codec, { TFilterViewerProps, TFilterEditorProps, TValidationResult, TCellProps } from '../codec';
import { Input } from "reactstrap";

export default class StandardInt extends Codec<number, string> {
    readonly slug: string = "StandardInt";

    readonly cellComponent = StandardIntCell;

    readonly filterViewerComponent = StandardIntFilterViewer;
    readonly filterEditorComponent = StandardIntFilterEditor;

    defaultFilterValue() {
        return "";
    }

    private regex = /^(=|==|<=|>=|<|>|<>|!=)?(\d+\.?\d*)$/;
    cleanFilterValue(value: string, lastValue?: string): TValidationResult {
        const v = value.replace(/ /g, '');
        
        // if the value isn't valid return
        if (!this.regex.test(v)) {
            return { valid: false };
        }
        
        // else clean it up
        return {
            valid: true, 
            value: v.replace(this.regex, function standardizer(_: string, operator: string, value: string) {
                let actualOperator: string = operator;
                
                if (typeof operator === 'undefined' || operator === "=" || operator === "==") actualOperator = "=";
                else if (operator === "<>" || operator === "!=") actualOperator = "!=";
                else actualOperator = operator;
                
                return actualOperator + value;
            })
        };
    }
}

class StandardIntCell extends React.Component<TCellProps<number>> {
    render() {
        const { value } = this.props;
        if (value === null) return null;

        return value.toString();
    }
}

class StandardIntFilterViewer extends React.Component<TFilterViewerProps<string>> {
    render() {
        const { value, children } = this.props;
        return <>
            { children }
            <i className="zoo-numeric-condition-display">{ value } </i>
        </>;
    }
}

class StandardIntFilterEditor extends React.Component<TFilterEditorProps<string>> {
    private handleValueChange = (event: ChangeEvent<HTMLInputElement>) => {
        this.props.onChange(event.target.value);
    }

    private handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            this.props.onApply();
        }
    }

    render() {
        const { value, valid } = this.props;
        return (
            <Input
                className="zoo-numeric-filter" type="text"
                onChange={this.handleValueChange}
                onKeyPress={this.handleKeyPress}
                value={value}
                valid={valid}
            />
        );
    }
}