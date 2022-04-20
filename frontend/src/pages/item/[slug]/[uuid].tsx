import type { GetServerSideProps } from "next";
import React from "react";
import { Col, Container, Row, Table } from "reactstrap";
import { MHDBackendClient } from "../../../client";
import { TMHDCollection, TMHDItem } from "../../../client/rest";
import MHDMain from "../../../components/common/MHDMain";
import PropertyInfoButton from "../../../components/common/PropertyInfoButton";
import TemplateManager from "../../../templates";

interface TemplateContext<T> {
    collection: TMHDCollection;
    item: TMHDItem<T>;
}
interface MHDItemViewProps<T> extends TemplateContext<T> {
    html?: string;
}

/** Renders a collection that is not found */
export default function ItemPage<T>({ collection, item, html }: MHDItemViewProps<T>) {
    return <MHDMain title={`Item ${item._id}`} wide={true}>
        <Container>
            <Row>
                <Col sm="12">
                    {typeof html === "string" ?
                        <CustomTemplate html={html} collection={collection} item={item} /> :
                        <DefaultTemplate collection={collection} item={item} />
                    }
                </Col>
            </Row>
        </Container>
    </MHDMain>;
}

function CustomTemplate<T>({ html, collection, item }: TemplateContext<T> & { html: string }) {
    return <>{ manager.renderToElement(html, { collection, item }) }</>;
}

function DefaultTemplate<T>({ collection, item }: TemplateContext<T>) {
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

    return <Table>
        <thead>
            <tr>
                <th>Property</th>
                <th>Value</th>
            </tr>
        </thead>
        <tbody>
            {rows}
        </tbody>
    </Table>;
}

function RenderPropertyValue<T>( { property, collection, item }: TemplateContext<T> & { property: string}) { 
    const pCollection = MHDBackendClient.getInstance().parseCollection(collection);

    const codec = pCollection.codecMap.get(property);
    if(!codec) return <>Unknown property or missing codec <code>{property}</code></>;
    const Cell = codec.cellComponent;

    return <Cell value={item[property]} codec={codec} />;
}

interface ManagerContext extends TemplateContext<any> {
    args: Array<any>
}

const manager = new TemplateManager<TemplateContext<any> & { args: Array<any> }>();
manager.registerComponent("property", ({ args, collection, item }: ManagerContext) => {
    const [property] = args;
    if (typeof property !== "string") return null; // missing argument
    return <RenderPropertyValue collection={collection} item={item} property={property} />;
}, 1)

export const getServerSideProps: GetServerSideProps = async function ({ params: { slug, uuid } }) {
    const [collection, item] = await MHDBackendClient.getInstance().fetchCollectionAndItem(slug as string, uuid as string);

    // TODO: Write documentation on which language we use!
    const template: string | null = null //` {{ property( "basis" ) }}`; // TODO: Fetch template from the collection
    
    const html = template ? (await manager.renderToHTML(template, { collection, item })) : null;
    return {
        props: { collection, item, html },
    }
}