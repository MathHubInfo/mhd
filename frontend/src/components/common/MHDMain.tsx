import React from 'react';
import { Row, Col, Container } from "reactstrap";
import styles from './MHDMain.module.css';

interface MHDMainProps {
    /** title of the current page */
    title: React.ReactNode;

    /** head displayed on top of other elements */
    head? : React.ReactNode | React.ReactNode[];

    /** children in the left head */
    leftHead?: React.ReactNode | React.ReactNode[];

    /** buttons for the header */
    buttons?: React.ReactNode | React.ReactNode[];

    /** children in the right head */
    rightHead?: React.ReactNode | React.ReactNode[];

    /** children at the bottom */
    children?: React.ReactNode | React.ReactNode[];
}

/**
 * The main layouting component
 */
export default class MHDMain extends React.Component<MHDMainProps> {
    render() {
        const { title, head, leftHead, buttons, rightHead, children } = this.props;
        return (
            <main>
                <MHDMainHead title={title} head={head} leftHead={leftHead} buttons={buttons} rightHead={rightHead} />
                { children }
            </main>
        );
    }
}

type MHDMainHeadProps = Pick<MHDMainProps, 'title' | 'head' | 'leftHead' | 'buttons' | 'rightHead'>

/** Layouting head */
export class MHDMainHead extends React.Component<MHDMainHeadProps> {
    render() {
        const { title, head, leftHead, buttons, rightHead } = this.props;

        return (
            <section className={`${styles.search}`}>
                <Container>
                    { head }
                    <Row>
                        <Col lg="3" sm="12" className="mx-auto my-4">
                            <h2 className="section-heading">{title}</h2>                 
                            { leftHead }
                            <div className={styles.buttons}>{ buttons }</div>
                        </Col>
                        <Col lg="9" sm="12">
                            { rightHead }
                        </Col>
                    </Row>
                </Container>
            </section>
        );
    }
}

type MHDLoadingProps = Pick<MHDMainProps, 'leftHead'>;

/** Represents a loading component */
export class MHDLoading extends React.Component<MHDLoadingProps> {
    render() {
        return <MHDMain title={'Loading...'} leftHead={this.props.leftHead} />;
    }
}