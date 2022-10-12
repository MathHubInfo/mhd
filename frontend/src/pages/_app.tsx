import type { AppProps } from "next/app"
import Head from "next/head"

// load custom styles
import "../css/bootstrapMHD.scss"
import "katex/dist/katex.min.css"

// load font-awesome
import "@fortawesome/fontawesome-svg-core/styles.css"
import { config } from "@fortawesome/fontawesome-svg-core"
config.autoAddCss = false


//
// local imports
//

import * as React from "react"
import { default as Link } from "next/link"
import { Col, Container, Row, Navbar, NavbarBrand, NavbarToggler, Collapse, Nav, NavItem, NavLink, Alert } from "reactstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faGithub } from "@fortawesome/free-brands-svg-icons"

import { AboutExternal, AboutInternal, appBranding, appTitle, Debug, DjangoAdmin, Index, isProduction, singleCollection } from "../controller"


export default function MHDApp({ Component, pageProps }: AppProps<{}>) {
    return <>
        <Head>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

            {/* Icons */}
            <link rel="shortcut icon" href="/favicon.ico" />
            <link rel="apple-touch-icon" sizes="180x180" href="/img/fav/apple-touch-icon.png" />
            <link rel="icon" type="image/png" sizes="32x32" href="/img/fav/favicon-32.png" />
            <link rel="icon" type="image/png" sizes="16x16" href="/img/fav/favicon-16.png" />
            <link rel="mask-icon" href="/img/fav/safari-pinned-tab.svg" color="#ef6d4b" />

            {/* Manifest and title */}
            <meta name="apple-mobile-web-app-title" content={appTitle} />
            <meta name="application-name" content={appTitle} />
            <meta name="msapplication-TileColor" content="#da532c" />
            <meta name="theme-color" content="#ffffff" />
        </Head>

        <header><MHDHeader /></header>
        <Component {...pageProps} />
        {!isProduction && <DevFooter />}
    </>
}

//
// HEADER
//


type MHDHeaderState = {
    isOpen: boolean;
}

class MHDHeader extends React.Component<{}, MHDHeaderState> {
    state: MHDHeaderState = {
        isOpen: false,
    }

    private toggle = () => {
        this.setState(({ isOpen }: MHDHeaderState) => ({ isOpen: !isOpen }))
    }

    render() {
        const { isOpen } = this.state

        const aboutInternal = AboutInternal()
        const aboutExternal = AboutExternal()

        return (
            <Navbar color="light" light expand="md">
                <NavbarBrand href={Index()}>{appBranding}</NavbarBrand>
                <NavbarToggler onClick={this.toggle} />
                <Collapse isOpen={isOpen} navbar>
                    <Nav className="ml-auto" navbar>
                        <NavItem>
                            { aboutInternal && 
                                <Link href={aboutInternal} passHref>
                                    <NavLink as="a">
                                        About
                                    </NavLink>
                                </Link>
                            }
                            { aboutExternal &&
                                <NavLink href={aboutExternal} className={"item-link"}>
                                    About
                                </NavLink>
                            }
                        </NavItem>
                        <NavItem>
                            <NavLink href="https://github.com/MathHubInfo/mhd" className={"item-link"} target="_blank" rel="noopener noreferrer">
                                <FontAwesomeIcon icon={faGithub} /> GitHub
                            </NavLink>
                        </NavItem>
                    </Nav>
                </Collapse>
            </Navbar>
        )
    }
}

//
// FOOTER
//

function DevFooter() {
    return <footer>
        <Container>
            <Row style={{ textAlign: "center", marginTop: "1em" }}>
                <Col>
                    <Alert color="info">
                        Running in Development {singleCollection === null && <>(Single Collection Mode <code>{singleCollection}</code>)</>} <br />
                        <Link href={Debug()} passHref><a>Debug Page</a></Link>{" / "}
                        <Link href={DjangoAdmin()} passHref><a>Django Admin</a></Link>
                    </Alert>
                </Col>
            </Row>
        </Container>
    </footer>
}
