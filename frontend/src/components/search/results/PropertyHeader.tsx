import * as React from "react"
import { Button } from "reactstrap"
import { MHDBackendClient, TCollectionPredicate } from "../../../client"
import type { TMHDCollection, TMHDProperty } from "../../../client/rest"
import CodecManager from "../../../codecs"
import type { CodecExporter } from "../../../exporters"
import PropertyHover from "../../common/PropertyInfoButton"

type PropertyHeaderContextual = {
    collection: TMHDCollection;
    query: TCollectionPredicate;
    order: string;
}
type PropertyHeaderProps = {
    property: TMHDProperty;
}

export const PropertyHeaderContext = React.createContext<PropertyHeaderContextual>(undefined!);

export default class PropertyHeader extends React.Component<PropertyHeaderProps> {
    render() {
        const { property } = this.props
        const { exporters } = CodecManager.getInstance().get(property.codec)
        return <PropertyHeaderContext.Consumer>{
            ({ collection, query, order }) => <>
                {property.displayName}
                
                <PropertyHover large prop={property}/>
                    {exporters.map(e =>
                    <PropertyExportButton 
                        key={e.slug}

                        exporter={e}
                        collection={collection}
                        property={property}

                        query={query}
                        order={order}
                    />
                )}
            </>
        }</PropertyHeaderContext.Consumer>
    }
}

type PropertyExportButtonProps<T> = PropertyHeaderContextual & PropertyHeaderProps & {
    exporter: CodecExporter<T>
}
interface PropertyExportButtonState {
    started: boolean;
    progress: number;
    finished: boolean;
    error?: any;
}


class PropertyExportButton<T> extends React.Component<PropertyExportButtonProps<T>, PropertyExportButtonState> {
    state: PropertyExportButtonState = {
        started: false,
        progress: 0,
        finished: false,
    }
    private blob: Blob | null
    private readonly start = async () => {
        if (!this.mounted) return

        this.setState({
            started: true,
            progress: 0,
            finished: false,
        }, async () => {
            const { collection: { slug }, query, property, order, exporter } = this.props
            const client = MHDBackendClient.getInstance()
            
            let blob: Blob
            let error: any
            try {
                blob = await exporter.export(client, slug, property.slug, query, order, this.updateProgress,)          
            } catch(e) {
                error = e
            }
            if (!this.mounted) return
    
            this.blob = blob
            this.setState({ finished: true, error })
        })
    }

    private readonly updateProgress = (progress: number): boolean => {
        if(this.mounted) {
            this.setState({ progress })
        }
        return this.mounted
    }

    private defaultFilename(): string {
        const { collection: { slug }, exporter: { defaultExtension } } = this.props
        return `${slug}.${defaultExtension}`
    }
    
    /**
     * downloads the file for the user
     */
    private readonly download = async () => {
        const url = URL.createObjectURL(this.blob)

        const a = document.createElement("a")
        a.setAttribute("href", url)
        a.setAttribute("download", this.defaultFilename())
        
        document.body.append(a)
        a.click()
        a.parentNode.removeChild(a)
        
        URL.revokeObjectURL(url)
    }

    private mounted = false
    componentDidMount() {
        this.mounted = true
    }
    componentWillUnmount(): void {
        this.mounted = false
        this.blob = null
    }
    
    render() {
        const { progress, started, finished, error } = this.state
        const { exporter: { displayName } } = this.props
        return <>
            {!started && <Button onClick={this.start}>Export {displayName}</Button>}
            {started && !finished && <Button disabled color="info">Exporting {displayName}: {Math.floor(progress * 100)}%</Button>}
            {(finished && !error) && <Button onClick={this.download} color="success">Download {displayName}</Button>}
            {(finished && error) && <Button onClick={this.start} color="danger">Download {displayName} failed: {error.toString()}</Button>}
        </>
    }
}