import type { GetServerSideProps } from "next";
import React from "react";
import { Col, Container, Row, Table } from "reactstrap";
import { MHDBackendClient } from "../../../client";
import { TMHDCollection, TMHDItem } from "../../../client/rest";
import MHDMain from "../../../components/common/MHDMain";
import PropertyInfoButton from "../../../components/common/PropertyInfoButton";

interface MHDItemViewProps<T> {
    collection: TMHDCollection;
    item: TMHDItem<T>
}

/** Renders a collection that is not found */
export default function ItemPage<T>({ collection, item }: MHDItemViewProps<T>) {
    const pCollection = MHDBackendClient.getInstance().parseCollection(collection);

    // render rows for the main table
    const rows = collection.properties.map(p => {
        const codec = pCollection.codecMap.get(p.slug);
        if (!codec) return null;

        const Cell = codec.cellComponent;
        return <tr key={p.slug}>
            <td>{p.displayName}<PropertyInfoButton prop={p} /></td>
            <td><Cell value={item[p.slug]} codec={codec} /></td>
        </tr>
    });

    return <MHDMain title={`Item ${item._id}`} wide={true}>
        <Container>
            <Row>
                <Col sm="12">
                    <Table>
                        <thead>
                            <tr>
                                <th>Property</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows}
                        </tbody>
                    </Table>
                </Col>
            </Row>
        </Container>
    </MHDMain>;
}

export const getServerSideProps: GetServerSideProps = async function ({ params: { slug, uuid } }) {
    const [collection, item] = await MHDBackendClient.getInstance().fetchCollectionAndItem(slug as string, uuid as string);

    return {
        props: { collection, item },
    }
}