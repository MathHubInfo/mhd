import React from 'react';
import { Column, CellInfo } from "react-table";
import { TMDHProperty } from "../client/rest";

type ReactComponent<T> = React.ComponentClass<T> | React.SFC<T>

export interface TCellProps<CodecType extends Codec<ElementType, FilterType>, ElementType, FilterType> {
    /** the value of this cell (if any) */
    value: ElementType | null,

    /** the codec instance used for this cell */
    codec: CodecType
}

export type TValidationResult = {
    /** the value was not valid */
    valid: false;

    /** optional error message as a reason for failure */
    message?: string;
} | {
    /** the value was valid */
    valid: true;

    /** the validated and cleaned value */
    value: string;
};


export interface TFilterViewerProps<CodecType extends Codec<ElementType, FilterType>, ElementType, FilterType> {
    /** the codec instance used for this viewer */
    codec: CodecType

    /** the current value of the filter */
    value: FilterType;
    
    /** rendered information about the component in question */
    children: React.ReactChild;
}

export interface TFilterEditorProps<CodecType extends Codec<ElementType, FilterType>, ElementType, FilterType> {
    /** the codec instance used for this viewer */
    codec: CodecType

    /** the current value of the filter */
    value: FilterType;

    /** indicates if this value has been validated or not */
    valid?: boolean;
    
    /** rendered information about the component in question */
    children: React.ReactChild;

    /** called when the value of this filter component changes */
    onChange: (value: FilterType, surpressValidation?: boolean) => void

    /** called when this filter is intended to be saved */
    onApply: () => void
}

/**
 * The Codec class represents data about a single codec for the frontend
 * 
 * @tparam ElementType type of elements of this codec
 * @tparam FilterType type in which filters of this value are represented
 */
export default abstract class Codec<ElementType = any, FilterType = string> {

    /** the slug of this codec */
    abstract readonly slug: string;

    /**
     * Component used for rendering cells of this value
     */
    abstract readonly cellComponent: ReactComponent<TCellProps<any, ElementType, FilterType>>;

    /**
     * Makes a React-Table Column for an instatiation of this codec
     * @param property 
     */
    makeReactTableColumn(property: TMDHProperty): Column<{}> {
        const Component = this.cellComponent;
        return {
            Cell: ({original}: CellInfo) => <Component value={original[property.slug]} codec={this} />,
            Header: property.displayName,
        }
    }

    /**
     * Cleans and validates a filter of this type.
     * @param value 
     * @param lastValue last known validated value, may be undefined if no value exists. 
     */
    abstract cleanFilterValue(value: FilterType, lastValue?: string): TValidationResult

    /** gets the default filter value for this type */
    abstract defaultFilterValue(): FilterType;

    /**
     * A component that is used for rendering a filter
     */
    abstract readonly filterViewerComponent: ReactComponent<TFilterViewerProps<any, ElementType, FilterType>>;

    /**
     * A component that is used for rendering the editor
     */
    abstract readonly filterEditorComponent: ReactComponent<TFilterEditorProps<any, ElementType, FilterType>>;
}