import type { ChangeEvent, KeyboardEvent, CSSProperties } from "react"
import React from "react"
import type { TFilterViewerProps, TFilterEditorProps, TValidationResult, TPresenterProps } from "../codec"
import Codec from "../codec"
import styles from "./StandardInt.module.css"

export default class StandardInt extends Codec<number, string> {
    readonly slug: string = "StandardInt"
    readonly ordered: boolean | "+" | "-" = true

    readonly cellComponent = StandardIntCell

    readonly _filterViewerComponent = StandardIntFilterViewer
    readonly _filterEditorComponent = StandardIntFilterEditor

    parseFilterValue(value: string | null) {
        if (value !== null && this.regex.test(value)) return value
        return ""
    }

    private regex = /^(=|==|<=|>=|<|>|<>|!=)?(\d+\.?\d*)$/
    cleanFilterValue(value: string, lastValue?: string): TValidationResult {
        const v = value.replace(/ /g, "")
        
        // if the value isn't valid return
        if (!this.regex.test(v)) {
            return { valid: false }
        }
        
        // else clean it up
        return {
            valid: true, 
            value: v.replace(this.regex, function standardizer(_: string, operator: string, value: string) {
                let actualOperator: string = operator
                
                if (typeof operator === "undefined" || operator === "=" || operator === "==") actualOperator = "="
                else if (operator === "<>" || operator === "!=") actualOperator = "!="
                else actualOperator = operator
                
                return actualOperator + value
            }),
        }
    }

    toClipboardValue(value: number): string | null {
        return value.toString()
    }
}

class StandardIntCell extends React.Component<TPresenterProps<StandardInt, number, string>> {
    render() {
        const { value } = this.props
        if (value === null) return null

        return value.toString()
    }
}

class StandardIntFilterViewer extends React.Component<TFilterViewerProps<StandardInt, number, string>> {
    render() {
        const { value, children } = this.props
        return <>
            { children }
            <i className={styles.StandardIntDisplay}>{ value } </i>
        </>
    }
}

class StandardIntFilterEditor extends React.Component<TFilterEditorProps<StandardInt, number, string>> {
    private handleValueChange = (event: ChangeEvent<HTMLInputElement>) => {
        this.props.onChange(event.target.value)
    }

    private handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            this.props.onApply()
        }
    }

    render() {
        const { value, children, valid } = this.props

        // TODO: Use classes for this
        const style: CSSProperties = {}
        if (valid === true) {
            style.border = "1px solid green"
            style.backgroundColor = "#28a745"
        } else if (valid === false) {
            style.border = "1px solid red"
            style.backgroundColor = "#dc3545"
        }

        return (
            <>
                { children }
                <input
                    autoFocus
                    type="text"
                    onChange={this.handleValueChange}
                    onKeyPress={this.handleKeyPress}
                    value={value}
                    style={style}
                />
            </>
        )
    }
}