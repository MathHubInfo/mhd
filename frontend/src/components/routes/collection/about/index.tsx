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
        const { collection: { displayName, description, metadata } } = this.props;

        return <MHDMain title={<LaTeX>{displayName}</LaTeX>}>
            <Container>
                <Row>
                    <Col sm="12">
                        <p><LaTeX>{description || "No description provided"}</LaTeX></p>
                        <p>
                        {(metadata.schemaTheoryURL && metadata.schemaTheoryURL.length > 0) &&
                            <a href={metadata.schemaTheoryURL}>Schema theory</a>
                        }
                        </p>
                        <p>Authors: {metadata.authors || "N/A"}</p>
                        <p>Size: {metadata.size || "N/A"}</p>
                        <ul>
                        {(metadata.references && metadata.references.length > 0) &&
                            metadata.references.map((r:any) => 
                                <li><a href={r.url}>{r.title}</a></li>
                            )
                        }
                        </ul>
                    </Col>
                </Row>
            </Container>
        </MHDMain>;
    }
}