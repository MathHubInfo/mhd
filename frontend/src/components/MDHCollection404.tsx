import React from 'react';
import { Container, Row, Col, Button } from "reactstrap";

interface MDHCollection404Props {
    /** name of the collection that could not be found */
    name: string;
}

/** Renders a collection that is not found */
export default class MDHCollection404 extends React.Component<MDHCollection404Props> {
    render() {
        const { name } = this.props;
        return (
            <section className="bg-primary">
                <Container>
                    <Row>
                        <Col>
                            <h2 className="section-heading text-white">Not Found</h2>                 
                            <p>Collection with slug <b>{name}</b> does not exist. </p>
                            <div className="buttons">
                                <a href="/"><Button>Back to Home</Button></a>
                            </div>
                            <p></p>
                        </Col>
                    </Row>
                </Container>
            </section>
        );
    }
}