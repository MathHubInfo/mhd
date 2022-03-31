import React from 'react';
import { default as Link } from "next/link";
import { Button, ListGroup, ListGroupItem, Row, Col } from "reactstrap";
import { MHDBackendClient } from "../../src/client";
import MHDMain from "../../src/components/common/MHDMain";
import LaTeX from "react-latex";
import CodecManager from "../../src/codecs";

import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
type HomeProps = InferGetServerSidePropsType<typeof getServerSideProps>

export default function Home({ page, collections: { results, num_pages } }: HomeProps) {
    const leftHead = <p>
        Select a collection to start browsing.
    </p>;

    const rightHead = <>
        <p />
        <ListGroup>
            {results.map(c => (
                <ListGroupItem key={c.slug}>
                    <Link href={`/collection/${c.slug}/`}>
                        <a>
                            <LaTeX>{c.displayName}</LaTeX>
                        </a>
                    </Link>
                </ListGroupItem>
            ))}
        </ListGroup>
    </>;

    const buttons = <>
        {(page - 1 >= 1) ? <Link href={`/home/${page - 1}`}><Button>Previous</Button></Link> : <Button disabled>Previous</Button>}
        &nbsp;
        {(page + 1 <= num_pages) ? <Link href={`/home/${page + 1}`}><Button>Next</Button></Link> : <Button disabled>Next</Button>}
    </>;

    const head = <Row>
        <Col>
        </Col>
    </Row>;

    // TODO: Title
    return <MHDMain title="Pick a dataset" head={head} leftHead={leftHead} buttons={buttons} rightHead={rightHead} />;
}


const PER_PAGE = 10; // TODO: Make this configurable on the top level!
export const getServerSideProps: GetServerSideProps = async function({ params: {no} }) {
    const pageNo = parseInt(no as string, 10);
    if (isNaN(pageNo)) return { notFound: true };

    const collections = await MHDBackendClient.getInstance().fetchCollections(pageNo, PER_PAGE);
    
    return {
        props: { page: pageNo, collections }, // will be passed to the page component as props
    }
}