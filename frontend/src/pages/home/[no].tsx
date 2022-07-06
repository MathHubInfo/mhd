import type { GetServerSideProps, InferGetServerSidePropsType } from "next"
import { default as Link } from "next/link"
import React from "react"
import LaTeX from "react-latex"
import { Button, Col, ListGroup, ListGroupItem, ListGroupItemHeading, ListGroupItemText, Row } from "reactstrap"
import { MHDBackendClient } from "../../client"
import type { TMHDCollection } from "../../client/rest"
import MHDMain from "../../components/common/MHDMain"
import { CollectionIndex, Home, homePerPage, singleCollection } from "../../controller"

type HomeProps = InferGetServerSidePropsType<typeof getServerSideProps>

export default function Page({ page, collections: { results, num_pages } }: HomeProps) {
    const leftHead = <p>
        Select a collection to start browsing.
    </p>

    const rightHead = <>
        <p />
        <ListGroup>
            {results.map((c: TMHDCollection) => (
                <ListGroupItem key={c.slug}>
                    <ListGroupItemHeading>
                        <Link href={CollectionIndex(c.slug)}>
                            <a>
                                <LaTeX>{c.displayName}</LaTeX>
                            </a>
                        </Link>
                        {c.count && <>
                            &nbsp; <small>({c.count} items)</small>
                        </>}
                    </ListGroupItemHeading>
                    <ListGroupItemText>
                            {c.metadata?.authors && <>
                                by <b>{c.metadata?.authors}</b>
                            </>}
                    </ListGroupItemText>
                </ListGroupItem>
            ))}
        </ListGroup>
    </>

    const buttons = <>
        {(page - 1 >= 1) ? <Link href={Home(page - 1)} passHref><Button>Previous</Button></Link> : <Button disabled>Previous</Button>}
        &nbsp;
        {(page + 1 <= num_pages) ? <Link href={Home(page + 1)} passHref><Button>Next</Button></Link> : <Button disabled>Next</Button>}
    </>

    const head = <Row>
        <Col>
        </Col>
    </Row>

    return <MHDMain title="Pick a dataset" textTitle="" head={head} leftHead={leftHead} buttons={buttons} rightHead={rightHead} />
}

export const getServerSideProps: GetServerSideProps = async function({ params: { no } }) {
    if (singleCollection !== null) return { notFound: true } // hide in single_collection mode

    const pageNo = parseInt(no as string, 10)
    if (isNaN(pageNo)) return { notFound: true }

    const collections = await MHDBackendClient.getInstance().fetchCollections(pageNo, homePerPage)
    
    return {
        props: { page: pageNo, collections },
    }
}