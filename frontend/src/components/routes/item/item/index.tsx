import React from 'react';
import MDHMain from "../../../common/MDHMain";
import { ParsedMDHCollection } from "../../../../client/derived";
import { TMDHItem } from "../../../../client/rest";
import { Table, Row, Col, Container } from "reactstrap";

interface MDHItemViewProps {
    /** collection */
    collection: ParsedMDHCollection;
    
    /** item */
    item: TMDHItem<any>
}

/** Renders a collection that is not found */
export default class MDHItemView extends React.Component<MDHItemViewProps> {
    render() {
        const { collection, item } = this.props;
        
        // render rows for the main table
        const rows = collection.properties.map(p => {
            const codec = collection.codecMap.get(p.slug);
            if (!codec) return null;

            const Cell = codec.cellComponent;
            return <tr key={p.slug}>
                <td>{p.displayName}</td>
                <td><Cell value={item[p.slug]} codec={codec} /></td>
            </tr>
        });

        return <MDHMain title={`Item ${item._id}`}>
            <Container>
                <Row>
                    <Col sm="12">
                        <Table>
                            <thead>
                                <tr>
                                    <th>Property</th>
                                    <th>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows}
                            </tbody>
                        </Table>
                    </Col>
                </Row>
            </Container>
        </MDHMain>;
    }
}