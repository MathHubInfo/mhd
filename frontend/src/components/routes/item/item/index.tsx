import React from 'react';
import MHDMain from "../../../common/MHDMain";
import { ParsedMHDCollection } from "../../../../client/derived";
import { TMHDItem } from "../../../../client/rest";
import { Table, Row, Col, Container } from "reactstrap";
import PropertyInfoButton from "../../../common/PropertyInfoButton";

interface MHDItemViewProps {
    /** collection */
    collection: ParsedMHDCollection;
    
    /** item */
    item: TMHDItem<any>
}

/** Renders a collection that is not found */
export default class MHDItemView extends React.Component<MHDItemViewProps> {
    render() {
        const { collection, item } = this.props;
        
        // render rows for the main table
        const rows = collection.properties.map(p => {
            const codec = collection.codecMap.get(p.slug);
            if (!codec) return null;

            const Cell = codec.cellComponent;
            return <tr key={p.slug}>
                <td>{p.displayName}<PropertyInfoButton prop={p} /></td>
                <td><Cell value={item[p.slug]} codec={codec} /></td>
            </tr>
        });

        return <MHDMain title={`Item ${item._id}`}>
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
        </MHDMain>;
    }
}