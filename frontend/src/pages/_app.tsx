import { AppProps } from "next/app";
import Head from "next/head";

// load the required fonts
import "typeface-cormorant-garamond";
import "typeface-cormorant-unicase";
import "typeface-montserrat";

// load custom styles
import "../css/bootstrapMHD.scss";
import "katex/dist/katex.min.css";

// load font-awesome
import "@fortawesome/fontawesome-free/js/all.js";


//
// local imports
//

import * as React from "react";
import Image from "next/image";
import { default as Link } from "next/link";
import { Col, Container, Row, Navbar, NavbarBrand, NavbarToggler, Collapse, Nav, NavItem, NavLink } from "reactstrap";
import eu_logo from "../images/logos/eu.svg";
import fau_logo from "../images/logos/fau_logo.png";
import kwarc_logo from "../images/logos/kwarc_logo.png";
import odk_logo from "../images/logos/opendreamkit_logo.png";


export default function MHDApp({ Component, pageProps }: AppProps<{}>) {
    return <>
        <Head>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
            
            {/* Icons */}
            <link rel="shortcut icon" href="%PUBLIC_URL%/favicon.ico" />
            <link rel="apple-touch-icon" sizes="180x180" href="%PUBLIC_URL%/img/fav/apple-touch-icon.png" />
            <link rel="icon" type="image/png" sizes="32x32" href="%PUBLIC_URL%/img/fav/favicon-32.png" />
            <link rel="icon" type="image/png" sizes="16x16" href="%PUBLIC_URL%/img/fav/favicon-16.png" />
            <link rel="mask-icon" href="%PUBLIC_URL%/img/fav/safari-pinned-tab.svg" color="#ef6d4b" />
            
            {/* Manifest and title */}
            <meta name="apple-mobile-web-app-title" content="MathDataHub" />
            <meta name="application-name" content="MathDataHub" />
            <meta name="msapplication-TileColor" content="#da532c" />
            <meta name="theme-color" content="#ffffff" />
        </Head>
        <header><MHDHeader /></header>
        <Component {...pageProps} />
        <footer><MHDFooter /></footer>
    </>
}

//
// HEADER
//


interface MHDHeaderState {
    isOpen: boolean;
}

class MHDHeader extends React.Component<{}, MHDHeaderState> {
    state: MHDHeaderState = {
        isOpen: false,
    }

    private toggle = () => {
        this.setState(({ isOpen }: MHDHeaderState) => ({ isOpen: !isOpen }));
    }

    render() {
        const { isOpen } = this.state;
        return (
            <Navbar color="light" light expand="md">
                <NavbarBrand href="/">MathDataHub - your dataset, but FAIR</NavbarBrand>
                <NavbarToggler onClick={this.toggle} />
                <Collapse isOpen={isOpen} navbar>
                    <Nav className="ml-auto" navbar>
                        <NavItem>
                            <NavLink tag={Link} href="/about/" target="_blank" rel="noopener noreferrer">About</NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink href="https://github.com/MathHubInfo/mhd" className={"item-link"} target="_blank" rel="noopener noreferrer">
                                <i className="fab fa-github"></i> GitHub
                            </NavLink>
                        </NavItem>
                    </Nav>
                </Collapse>
            </Navbar>
        );
    }
}

//
// FOOTER
//

function MHDFooter() {
    return (
        <footer>
            <Container>
                <Row style={{textAlign: "center", marginTop: "5em"}}>
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
            style={{margin: "0.5em 1.5em"}}>
            <Image src={props.pic} width={props.width} height={props.height} alt={props.alt} />
        </a>
    );
}