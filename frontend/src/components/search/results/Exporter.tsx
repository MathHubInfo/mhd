import { faAngleDown, faAngleUp } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import * as React from "react"
import { Button, Card, CardText, Col, Collapse, Row } from "reactstrap"
import { MHDBackendClient } from "../../../client"
import type { MHDFilter } from "../../../client/derived"
import type { TMHDCollection, TMHDPreFilter } from "../../../client/rest"
import type { Exporter } from "../../../exporters"
import ExporterManager from "../../../exporters/manager"

interface ExportersProps {
    exporters: string[]
    collection: TMHDCollection,
    pre_filter: TMHDPreFilter,
    filters: MHDFilter[],
}

export default function Exporters<T>({ collection, filters, pre_filter, exporters }: ExportersProps) {

    const keyFor = (exporter: Exporter<T>) => {
        return exporter.hashExport(collection.slug, filters, pre_filter)
    }

    const [expanded, setExpanded] = React.useState(false)

    const manager = ExporterManager.getInstance()
    const instances = exporters.map(s => manager.get(s)).filter(e => e !== undefined)
    if(instances.length === 0) return null

    return <Row>
        <Col>
            <Button color="link" onClick={() => setExpanded(!expanded)}>
                <FontAwesomeIcon icon={expanded ? faAngleUp : faAngleDown} />
                <span>Exports</span>
            </Button>
            <Collapse isOpen={expanded}>
                <Card body>
                    <CardText tag="div">{
                        exporters.map(s => manager.get(s)).filter(e => e !== undefined).map(exporter => {
                            return <ExporterButton
                                key={keyFor(exporter)}
                                exporter={exporter}
                                collection={collection}
                                pre_filter={pre_filter}
                                filters={filters}
                            />
                        })
                    }</CardText>
                </Card>
            </Collapse>  
        </Col>
    </Row>
}

interface ExporterButtonProps<T> {
    exporter: Exporter<T>
    collection: TMHDCollection,
    pre_filter: TMHDPreFilter,
    filters: MHDFilter[]
}
interface ExporterButtonState {
    started: boolean;
    progress: number;
    finished: boolean;
    error?: any;
}

export class ExporterButton<T> extends React.Component<ExporterButtonProps<T>, ExporterButtonState> {
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
            const { collection: { slug }, filters, pre_filter, exporter } = this.props
            const client = MHDBackendClient.getInstance()
            
            let blob: Blob
            let error: any
            try {
                blob = await exporter.export(client, slug, filters, pre_filter, this.updateProgress)          
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