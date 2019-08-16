import React from 'react';
import { Row, Col, Container } from "reactstrap";
import styles from './MDHMain.module.css';

interface MDHMainProps {
    /** title of the current page */
    title: string;

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
export default class MDHMain extends React.Component<MDHMainProps> {
    render() {
        const { title, leftHead, buttons, rightHead, children } = this.props;
        return (
            <main>
                <MDHMainHead title={title} leftHead={leftHead} buttons={buttons} rightHead={rightHead} />
                { children }
            </main>
        );
    }
}

type MDHMainHeadProps = Pick<MDHMainProps, 'title' | 'leftHead' | 'buttons' | 'rightHead'>

/** Layouting head */
export class MDHMainHead extends React.Component<MDHMainHeadProps> {
    render() {
        const { title, leftHead, buttons, rightHead } = this.props;

        return (
            <section className={`bg-primary ${styles.search}`}>
                <Container>
                    <Row>
                        <Col lg="3" sm="12" className="mx-auto my-4">
                            <h2 className="section-heading text-white">{title}</h2>                 
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

type MDHLoadingProps = Pick<MDHMainProps, 'leftHead'>;

/** Represents a loading component */
export class MDHLoading extends React.Component<MDHLoadingProps> {
    render() {
        return <MDHMain title={'Loading...'} leftHead={this.props.leftHead} />;
    }
}