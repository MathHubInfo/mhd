import React from 'react';
import { Container, Row, Col } from 'reactstrap';

/** Footer for the entire website */
export default function MDHFooter() {
    return(
        <footer className="bg-dark text-white">
            <Container>
                <Row>
                    <Col lg="4" className="my-5">
                    </Col>
                    <Col lg="4" className="my-5">
                    </Col>
                    <Col lg="4" className="my-5">
                    </Col>
                </Row>
            </Container>
        </footer>
    );
}