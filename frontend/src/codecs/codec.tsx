import React from "react"
import type { TMHDProperty, TMHDItem } from "../client/rest"
import { Badge } from "reactstrap"
import { isProduction } from "../controller"
import { CopyButton } from "../components/wrappers/share"
import type CodecExporter from "../exporters/codecs"
import PropertyHeader from "../components/query/results/PropertyHeader"
import type { CellComponentProps, TableColumn } from "../components/query/results/table"

type ReactComponent<T> = React.ComponentClass<T> | React.FunctionComponent<T>

export type TCellProps<CodecType extends Codec<ElementType, FilterType>, ElementType, FilterType> = {
    /** the value of this cell (if any) */
    value: ElementType | null,

    /** the codec instance used for this cell */
    codec: CodecType

    /** what kind of context this cell is being rendered in */
    context: CellRenderContext;
}

/**
 * Represents the context in which a code cell is shown
 */
 export enum CellRenderContext {
    /** inside a (react-table) powered context */
    Table = "tabular",
    /** inside a (custom or default) table view */
    Details = "details",
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


export type TFilterViewerProps<CodecType extends Codec<ElementType, FilterType>, ElementType, FilterType> = {
    /** the codec instance used for this viewer */
    codec: CodecType

    /** the current value of the filter */
    value: FilterType;
    
    /** rendered information about the component in question */
    children: React.ReactChild;
}

export type TFilterEditorProps<CodecType extends Codec<ElementType, FilterType>, ElementType, FilterType> = {
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

export type TPresenterProps<CodecType extends Codec<ElementType, FilterType>, ElementType, FilterType> = TCellProps<CodecType, ElementType, FilterType> & {
    /** is there a copy button that is being rendered? */
    hasCopyButton: boolean;
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

    /** the list of exporters for this codec */
    readonly exporters: Array<CodecExporter<ElementType, unknown>> = []

    /**
     * Component used for rendering cells of this value
     */
    abstract readonly cellComponent: ReactComponent<TPresenterProps<any, ElementType, FilterType>>

    /**
     * Makes a React-Table Column for an instatiation of this codec.
     * @param property 
     */
    makeReactTableColumn(property: TMHDProperty): TableColumn<TMHDItem<any>> {
        return {
            key: property.slug,
            Header: () => <PropertyHeader property={property} />,
            Cell: ({ data }: CellComponentProps<TMHDItem<any>>) => <RenderCodec context={CellRenderContext.Table} value={data[property.slug]} codec={this} />,
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

    /**
     * Turns a value of this type into a string to be copied to clipboard.
     */
    toClipboardValue(value: ElementType) : string | null {
        return null
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

class FallbackCell extends React.Component<TPresenterProps<any, any, null>> {
    render() {
        const { codec } = this.props
        
        return <>
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

type RenderState<E, F> = {
    error: boolean;
    copied: boolean;
    text: string | null;
    component: ReactComponent<TPresenterProps<any, E, F>>
}

/**
 * RenderCodec renders a codec instance safely, catching errors appropriatly
 */
export class RenderCodec<C extends Codec<E, F>, E, F> extends React.Component<TCellProps<C, E, F>, RenderState<E, F>> {
    state: RenderState<E, F> = {
        error: false,
        copied: false,
        text: null,
        component: null,
    }
    static getDerivedStateFromError(error: Error) {
        return { error: true }
    }
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        if(isProduction) return
        
        console.error("error rendering codec", error, errorInfo)
    }
    private timer : NodeJS.Timeout | null = null
    private readonly onCopy = () => {
        this.setState({ copied: true })
        if (this.timer) clearTimeout(this.timer)
        this.timer = setTimeout(() => {
            this.setState({ copied: false })
        }, 1000)
    }
    componentWillUnmount(): void {
        if (this.timer) clearTimeout(this.timer)
        this.timer = null
    }
    static getDerivedStateFromProps<C extends Codec<E, F>, E, F>({ codec, context, value }: TCellProps<C, E, F>) {
        // default state for error and copied
        const state: Partial<RenderState<E, F>> = {
            component: codec.cellComponent,
            text: null,
        }

        if(context === CellRenderContext.Details) {
            state.text = codec.toClipboardValue(value)
        }

        return state
    }
    render() {
        const { codec, value, context } = this.props

        const { error, copied, component: Component, text } = this.state
        if(error) {
            return <Badge color="danger">Error rendering {codec.slug}</Badge>
        }
    
        const hasCopyButton = typeof text === "string"
        return <>
            <Component context={context} hasCopyButton={hasCopyButton} codec={codec} value={value} />
            {hasCopyButton && <>
                &nbsp;
                <CopyButton text={text} onCopy={this.onCopy} copied={copied} />
            </>}
        </>
    }
}
