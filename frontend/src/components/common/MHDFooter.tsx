import React from 'react';
import { Container, Row, Col } from 'reactstrap';

import eu_logo from '../../images/logos/eu.svg';
import fau_logo from '../../images/logos/fau_logo.png';
import kwarc_logo from '../../images/logos/kwarc_logo.png';
import odk_logo from '../../images/logos/opendreamkit_logo.png';

/** Footer for the entire website */
export default function MHDFooter() {
    return (
        <footer>
            <Container>
                <Row style={{textAlign: 'center', marginTop: '5em'}}>
                    <Col>
                        <LogoLink url="https://kwarc.info/" pic={kwarc_logo} alt="KWARC research group" width={80} height={80} />
                        <LogoLink url="https://fau.de/" pic={fau_logo} alt="FAU Erlangen-Nürnberg" width={220} height={43} />
                        <LogoLink url="https://opendreamkit.org/" pic={odk_logo} alt="OpenDreamKit" width={71} height={95} />
                        <LogoLink url="https://europa.eu/" pic={eu_logo} alt="EU" width={90} height={60} />
                    </Col>
                </Row>
            </Container>
        </footer>
    );
}

function LogoLink(props: { url: string; pic: any; alt: string, width: number, height: number }) {
    return (
        <a
            href={props.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{margin: '0.5em 1.5em'}}>
            <img src={props.pic} alt={props.alt} style={{ width: props.width, height: props.height }} />
        </a>
    );
}