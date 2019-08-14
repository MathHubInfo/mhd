import React from 'react';
import { Container, Row, Col } from 'reactstrap';

/** A Footer for the Zoo Website */
export default function MDHFooter() {
    return(
        <footer className="bg-dark" id="footer">
            <Container>
                <Row>
                    <Col lg="4" className="my-5 text-white">
                    </Col>
                    <Col lg="4" className="my-5 text-white">
                    </Col>
                    <Col lg="4" className="my-5 text-white">
                    </Col>
                </Row>
            </Container>
        </footer>
    );
}