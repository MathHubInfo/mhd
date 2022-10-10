import { faAngleDown, faAngleUp } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import * as React from "react"
import { Button, Card, CardText, Col, Collapse, Row } from "reactstrap"
import type { TCollectionPredicate } from "../../../client"
import type { ParsedMHDCollection } from "../../../client/derived"
import type CollectionExporter from "../../../exporters/collection"
import ExportButton from "../../../exporters/button"

interface ExportersProps {
    collection: ParsedMHDCollection,
    query: TCollectionPredicate,
    order: string,
}

export default function Exporters<T>({ collection, query, order }: ExportersProps) {

    const keyFor = (exporter: CollectionExporter<T>) => {
        return exporter.hashRun(null, collection.slug, query, "")
    }

    const [expanded, setExpanded] = React.useState(false)
    
    if(collection.exporterInstances.length === 0) return null

    return <Row>
        <Col>
            <Button color="link" onClick={() => setExpanded(!expanded)}>
                <FontAwesomeIcon icon={expanded ? faAngleUp : faAngleDown} />
                <span>Exports</span>
            </Button>
            <Collapse isOpen={expanded}>
                <Card body>
                    <CardText tag="div">{
                        collection.exporterInstances.map(exporter => {
                            return <ExportButton
                                key={keyFor(exporter)}

                                exporter={exporter}
                                collection={collection}
                                flags={null}
                                query={query}
                                order={order}
                            />
                        })
                    }</CardText>
                </Card>
            </Collapse>  
        </Col>
    </Row>
}