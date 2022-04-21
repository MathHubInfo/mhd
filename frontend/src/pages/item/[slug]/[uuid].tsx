import type { GetServerSideProps } from "next";
import Link from "next/link";
import React from "react";
import { Alert, Button, Col, Container, Row, Table } from "reactstrap";
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
    isDefault?: boolean;
}

/** Renders a collection that is not found */
export default function ItemPage<T>({ collection, item, html, isDefault }: MHDItemViewProps<T>) {

    const leftHead = process.env.NODE_ENV === "development" ? <DevelopmentInfo collection={collection} item={item} html={html} isDefault={isDefault} /> : null;

    const renderHTML = isDefault ? null : html;

    return <MHDMain title={`Item ${item._id}`} wide={true} leftHead={leftHead}>
        <Container>
            <Row>
                <Col sm="12">
                    {typeof renderHTML === "string" ?
                        <CustomTemplate html={renderHTML} collection={collection} item={item} /> :
                        <DefaultTemplate collection={collection} item={item} />
                    }
                </Col>
            </Row>
        </Container>
    </MHDMain>;
}

function DevelopmentInfo<T>({ isDefault, collection, item, html }: MHDItemViewProps<T>) {
    const target = `/item/${collection.slug}/${item._id}`;
    if (typeof html !== "string") {
        return <Alert color="info">
            <b>Development Mode Hint: </b>
            Currently rendering the <em>default template</em>. 
            No custom template available.
        </Alert>;
    }
    
    return <Alert color="info">
        <b>Development Mode Hint: </b>

        Currently rendering &nbsp;
        {
            isDefault ? <>
                the <em>default template</em>, <Link href={target} passHref><a>render the <em>custom template</em> instead</a></Link>. 
            </> : <>
                a <em>custom template</em>, <Link href={target + "?default=1"} passHref><a>render the <em>default template</em> instead</a></Link>. 
            </>
        }
    </Alert>
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

/** Present presents a property on the page using the appropriate component */
function Present<T>( { property, collection, item }: TemplateContext<T> & { property: string}) { 
    const pCollection = MHDBackendClient.getInstance().parseCollection(collection);

    const codec = pCollection.codecMap.get(property);
    if(!codec) return <Alert color="warning">Codec for property <code style={{fontSize: ".75rem"}}>{property}</code> on collection <code style={{fontSize: ".75rem"}}>{collection.slug}</code> not found.</Alert>;
    const Cell = codec.cellComponent;

    return <Cell value={item[property]} codec={codec} />;
}

/** Info renders information about a specific property */
function Info( { property, collection }: { collection: TMHDCollection, property: string}) { 
    const pCollection = MHDBackendClient.getInstance().parseCollection(collection);

    const prop = pCollection.propMap.get(property);
    if(!prop) return <Alert color="warning">Unknown property <code style={{fontSize: ".75rem"}}>{property}</code> on collection <code style={{fontSize: ".75rem"}}>{collection.slug}</code>.</Alert>;

    return <PropertyInfoButton prop={prop} />
}

interface ManagerContext extends TemplateContext<any> {
    args: Array<any>
}

const manager = new TemplateManager<TemplateContext<any> & { args: Array<any> }>();
manager.registerComponent("present", ({ args, collection, item }: ManagerContext) => {
    const [property] = args;
    if (typeof property !== "string") return null; // missing argument
    return <Present collection={collection} item={item} property={property} />;
}, 1)
manager.registerComponent("info", ({ args, collection, item }: ManagerContext) => {
    const [property] = args;
    if (typeof property !== "string") return null; // missing argument
    return <Info collection={collection} property={property} />;
}, 1)


export const getServerSideProps: GetServerSideProps = async function ({ params: { slug, uuid }, query: { default: dflt } }) {
    const [collection, item] = await MHDBackendClient.getInstance().fetchCollectionAndItem(slug as string, uuid as string);

    const isDefault = dflt === "1";

    const template = collection.template;
    const html = template ? (await manager.renderToHTML(template, { collection, item })) : null;
    return {
        props: { collection, item, html, isDefault },
    }
}