import * as React from "react"
import { Button } from "reactstrap"
import type { ClientSideExporter } from "."
import type { TCollectionPredicate } from "../client"
import type { TMHDCollection } from "../client/rest"

type ExportButtonProps<Flags> = {
    exporter: ClientSideExporter<Flags, unknown, Blob, unknown>,
    flags: Flags, 

    collection: TMHDCollection;
    query: TCollectionPredicate,
    order: string,
}

type ExporterButtonState = {
    started: boolean;
    progress: number;
    finished: boolean;
    error?: any;
}

/**
 * ExportButton is a button that runs an export
 */
export default class ExportButton<Flags> extends React.Component<ExportButtonProps<Flags>, ExporterButtonState> {
    state: ExporterButtonState = {
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
            const { exporter, flags, collection: { slug }, query, order } = this.props
            
            let blob: Blob
            let error: any
            try {
                blob = await exporter.run(flags, slug, query, order, this.updateProgress,)          
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

    /** defaultFilename generates the default filename */
    private defaultFilename(): string {
        const { collection: { slug }, exporter: { defaultExtension } } = this.props
        return `${slug}.${defaultExtension}`
    }
    
    
    /** download downloads the file for the user */
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