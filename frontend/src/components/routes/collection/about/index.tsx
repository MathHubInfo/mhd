import React from 'react';
import MHDMain from "../../../common/MHDMain";
import { ParsedMHDCollection } from "../../../../client/derived";
import { MHDBackendClient } from  "../../../../client/";
import { Row, Col, Container } from "reactstrap";
import LaTeX from 'react-latex';

interface MHDCollectionAboutProps {
    /** client to talk to the server */
    client: MHDBackendClient;

    /** collection that was read */
    collection: ParsedMHDCollection;

    /** timeout under which to not show the loading indicator */
    results_loading_delay: number;
}

/** Renders a collection that is not found */
export default class MHDCollectionAboutPage extends React.Component<MHDCollectionAboutProps> {
    render() {
        const { collection } = this.props;

        return <MHDMain title={<LaTeX>{collection.displayName}</LaTeX>}>
            <Container>
                <Row>
                    <Col sm="12">
                        { JSON.stringify(collection.metadata) }
                    </Col>
                </Row>
            </Container>
        </MHDMain>;
    }
}