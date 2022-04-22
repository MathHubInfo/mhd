import React from "react"
import type { TMHDProperty, TMHDItem } from "../client/rest"
import { Badge } from "reactstrap"
import type { TableColumn, CellComponentProps } from "../components/wrappers/table"
import PropertyInfoButton from "../components/common/PropertyInfoButton"

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
}


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
    abstract readonly slug: string

    /** how can elements of this codec be meaningfully ordered? */
    abstract readonly ordered: boolean | "+" | "-" // true, + => ascending, - => descending, false => not orderable

    /**
     * Component used for rendering cells of this value
     */
    abstract readonly cellComponent: ReactComponent<TCellProps<any, ElementType, FilterType>>

    /**
     * Makes a React-Table Column for an instatiation of this codec
     * @param property 
     */
    makeReactTableColumn(property: TMHDProperty): TableColumn<TMHDItem<any>> {
        const Component = this.cellComponent
        return {
            key: property.slug,
            Header: () => <>{property.displayName}<PropertyInfoButton prop={property}/></>,
            Cell: ({ data }: CellComponentProps<TMHDItem<any>>) => <Component value={data[property.slug]} codec={this} />,
        }
    }

    /**
     * Cleans and validates a filter of this type.
     * @param value 
     * @param lastValue last known validated value, may be undefined if no value exists. 
     */
    abstract cleanFilterValue(value: FilterType, lastValue?: string): TValidationResult

    /**
     * parses the filter value from a string or returns the default. 
     * Implementation by sub-class may not assume that the value is valid. 
     */
    abstract parseFilterValue(value: string | null): FilterType

    /**
     * determines if a property with this codec should be hidden from the filter list
     * By default hides every property iff it does not have an associated _filterViewerComponent 
     */
    hiddenFromFilterList(property: TMHDProperty): boolean {
        return !this._filterViewerComponent || !this._filterEditorComponent
    }

    /**
     * A component that is used for rendering a filter
     */
    protected abstract readonly _filterViewerComponent: ReactComponent<TFilterViewerProps<any, ElementType, FilterType>> | null

    filterViewerComponent(): ReactComponent<TFilterViewerProps<any, ElementType, FilterType>> {
        return this._filterViewerComponent || UnsupportedFilterViewer
    }

    /**
     * A component that is used for rendering the editor
     */
    protected abstract readonly _filterEditorComponent: ReactComponent<TFilterEditorProps<any, ElementType, FilterType>> | null

    filterEditorComponent(): ReactComponent<TFilterEditorProps<any, ElementType, FilterType>> {
        return this._filterEditorComponent || UnsupportedFilterEditor
    }
}


export class Fallback extends Codec<any, null> {
    constructor(public readonly slug: string) {
        super()
    }

    readonly ordered: boolean = false

    readonly cellComponent = FallbackCell

    readonly _filterViewerComponent = null
    readonly _filterEditorComponent = null

    parseFilterValue() {
        return null
    }

    cleanFilterValue(value: null, lastValue?: string): TValidationResult {
        return { valid: false, message: "Unknown codec" }
    }
}

class FallbackCell extends React.Component<TCellProps<any, any, null>> {
    render() {
        const { children, codec } = this.props
        
        return <>
            { children }
            <Badge color="danger">Unknown Codec {codec.slug}</Badge>
        </>
    }
}

class UnsupportedFilterViewer<ElementType, FilterType> extends React.Component<TFilterViewerProps<any, ElementType, FilterType>> {
    render() {
        const { children, codec } = this.props
        return <>
            { children }
            <Badge color="danger">Filters for {codec.slug} is not supported</Badge>
        </>
    }
}

class UnsupportedFilterEditor<ElementType, FilterType> extends React.Component<TFilterEditorProps<any, ElementType, FilterType>> {
    render() {
        const { children, codec } = this.props
        return <>
            { children }
            <Badge color="danger">Filters for {codec.slug} is not supported</Badge>
        </>
    }
}
