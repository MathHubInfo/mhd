import React from "react"
import { Row, Col, Container } from "reactstrap"
import styles from "./MHDMain.module.css"
import Head from "next/head"
import { appTitle, isProduction } from "../../controller"

type MHDMainProps = {
    /** title of the current page */
    title: React.ReactNode

    /** textual title to use, defaults to title */
    textTitle?: string

    /** head displayed on top of other elements */
    head? : React.ReactNode | React.ReactNode[]

    /** use a wide head */
    wide?: boolean | "fancy"

    /** content below the title */
    titleRow?: React.ReactNode | React.ReactNode[]

    /** children in the left head */
    leftHead?: React.ReactNode | React.ReactNode[]

    /** buttons for the header */
    buttons?: React.ReactNode | React.ReactNode[]

    /** children in the right head */
    rightHead?: React.ReactNode | React.ReactNode[]

    /** children at the bottom */
    children?: React.ReactNode | React.ReactNode[]
}

/**
 * The main layouting component
 */
export default class MHDMain extends React.Component<MHDMainProps> {
    render() {
        const { title, textTitle, titleRow, head, wide, leftHead, buttons, rightHead, children } = this.props
        
        return (
            <main>
                <MHDMainHead title={title} textTitle={textTitle} titleRow={titleRow} head={head} wide={wide} leftHead={leftHead} buttons={buttons} rightHead={rightHead} />
                { children }
            </main>
        )
    }
}

type MHDMainHeadProps = Pick<MHDMainProps, "title" | "textTitle" | "titleRow" | "head" | "leftHead" | "buttons" | "rightHead" | "wide">

/** Layouting head */
export class MHDMainHead extends React.Component<MHDMainHeadProps> {
    componentDidMount() {
        this.checkReceivedTitle()
    }
    componentDidUpdate() {
        this.checkReceivedTitle()
    }
    private readonly checkReceivedTitle = () => {
        if (isProduction) return

        const { textTitle, title } = this.props
        if (typeof title !== "string" && !textTitle) {
            console.warn("MHDMainHead: Received non-string title, but no textTitle", title, textTitle)
        }
    }
    render() {
        const { title, textTitle, titleRow, head, wide, leftHead, buttons, rightHead } = this.props

        let body: React.ReactNode
        if (wide === true) {
            body = <Col>
                <h2 className="section-heading">{title}</h2>
                { titleRow }               
                { leftHead }
                <div className={styles.buttons}>{ buttons }</div>
                { rightHead }
            </Col>
        } else if (wide === "fancy") {
            body = <>
                <Col sm="12">
                    <h2 className="section-heading">{title}</h2>
                    { titleRow }
                </Col>
                <Col sm="5" className="mx-auto my-4">              
                    { leftHead }
                </Col>
                <Col sm="7">
                    { rightHead }
                </Col>
                <Col sm="12">
                    <div className={styles.buttons}>{ buttons }</div>
                </Col>
            </>
        } else {
            body = <>
                <Col lg="3" sm="12" className="mx-auto my-4">
                    <h2 className="section-heading">{title}</h2>
                    { titleRow }                
                    { leftHead }
                    <div className={styles.buttons}>{ buttons }</div>
                </Col>
                <Col lg="9" sm="12">
                    { rightHead }
                </Col>
            </>
        }

        const pageTitle = textTitle ?? title

        return (
            <section className={`${styles.search}`}>
                <Head><title>{ pageTitle ? `${pageTitle} | ${appTitle}` : appTitle}</title></Head>
                <Container>
                    { head }
                    <Row>
                        { body }
                    </Row>
                </Container>
            </section>
        )
    }
}