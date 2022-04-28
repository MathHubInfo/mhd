import type { GetServerSideProps } from "next"
import Link from "next/link"
import React from "react"
import LaTeX from "react-latex"
import { Alert, Col, Container, Row, Table } from "reactstrap"
import { MHDBackendClient } from "../../../client"
import type { TMHDCollection, TMHDItem } from "../../../client/rest"
import MHDMain from "../../../components/common/MHDMain"
import PropertyInfoButton from "../../../components/common/PropertyInfoButton"
import TemplateManager from "../../../templates"
import renderHTMLAsReact from "../../../templates/html"
import { isProduction, Item } from "../../../controller"
import { RenderCodec } from "../../../codecs/codec"
import type { ParsedMHDCollection } from "../../../client/derived"

interface TemplateContext<T> {
    collection: ParsedMHDCollection;
    item: TMHDItem<T>;
}
interface MHDItemViewProps<T> {
    collection: TMHDCollection;
    item: TMHDItem<T>;
    html?: string;
    isDefault?: boolean;
}

/** Renders a collection that is not found */
export default function ItemPage<T>({ collection, item, html, isDefault }: MHDItemViewProps<T>) {
    const renderHTML = isDefault ? null : html

    return typeof renderHTML === "string" ?
        <CustomItemPage html={renderHTML} collection={collection} item={item} /> :
        <DefaultItemPage collection={collection} item={item} />
}

function DevelopmentInfo<T>({ isDefault, collection, item, html }: MHDItemViewProps<T>) {
    if(isProduction) return null // hide in production!

    const target = Item(collection.slug, item._id)
    if (typeof html !== "string") {
        return <Alert color="info">
            <b>Development Mode Hint: </b>
            Currently rendering the <em>default template</em>.
            No custom template available.
        </Alert>
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

function CustomItemPage<T>({ html, collection, item, isDefault }: MHDItemViewProps<T> & { html: string }) {
    const record = new Map<string, string[]>()
    const pCollection = MHDBackendClient.getInstance().parseCollection(collection)
    const children = manager.render(html, { collection: pCollection, item }, record)

    const [titlestring] = record.get("pagetitle") ?? [null]
    const pagetitle = typeof titlestring === "string" ? <>{renderHTMLAsReact(titlestring)}</> : `Item ${item._id}`
    
    const [textTitle] = record.get("texttitle") ?? [undefined]

    return <MHDMain title={pagetitle} textTitle={textTitle} wide={true} leftHead={<DevelopmentInfo collection={collection} item={item} html={html} isDefault={isDefault} />}>
        <Container>
            <Row>
                <Col sm="12">
                    { children }
                </Col>
            </Row>
        </Container>
    </MHDMain>
}

function DefaultItemPage<T>({ collection, item, html, isDefault }: MHDItemViewProps<T>) {
    const pCollection = MHDBackendClient.getInstance().parseCollection(collection)
    // render rows for the main table
    const rows = collection.properties.map(p => {
        return <tr key={p.slug}>
            <td>{p.displayName}<Info property={p.slug} collection={pCollection} /></td>
            <td><Present property={p.slug} collection={pCollection} item={item}></Present></td>
        </tr>
    })

    return <MHDMain title={`Item ${item._id}`} wide={true} leftHead={<DevelopmentInfo collection={collection} item={item} html={html} isDefault={isDefault} />}>
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
    </MHDMain>
}

/** Present presents a property on the page using the appropriate component */
function Present<T>({ property, collection, item }: TemplateContext<T> & { property: string }) {
    const codec = collection.codecMap.get(property)
    if (!codec) return <Alert color="warning">Codec for property <code style={{ fontSize: ".75rem" }}>{property}</code> on collection <code style={{ fontSize: ".75rem" }}>{collection.slug}</code> not found.</Alert>

    return <RenderCodec value={item[property]} codec={codec} />
}

/** Info renders information about a specific property */
function Info({ property, collection }: { collection: ParsedMHDCollection, property: string }) {
    const prop = collection.propMap.get(property)
    if (!prop) return <Alert color="warning">Unknown property <code style={{ fontSize: ".75rem" }}>{property}</code> on collection <code style={{ fontSize: ".75rem" }}>{collection.slug}</code>.</Alert>

    return <PropertyInfoButton prop={prop} />
}

interface ManagerContext extends TemplateContext<any> {
    args: Array<any>
}

const manager = new TemplateManager<TemplateContext<any> & { args: Array<any> }>()
manager.registerComponent("present", ({ args, collection, item }: ManagerContext) => {
    const [property] = args
    if (typeof property !== "string") return null // missing argument
    return <Present collection={collection} item={item} property={property} />
}, 1)
manager.registerComponent("info", ({ args, collection }: ManagerContext) => {
    const [property] = args
    if (typeof property !== "string") return null // missing argument
    return <Info collection={collection} property={property} />
}, 1)
manager.registerComponent("math", ({ args, collection, item }: ManagerContext) => {
    const [property] = args
    if (typeof property !== "string") return null // missing argument
    return <LaTeX>{property}</LaTeX>
}, 1)
manager.registerRecordingFilter("pagetitle")
manager.registerRecordingFilter("texttitle")


export const getServerSideProps: GetServerSideProps = async function ({ params: { slug, uuid }, query: { default: dflt } }) {
    const client = MHDBackendClient.getInstance()

    const [collection, item] = await client.fetchCollectionAndItem(slug as string, uuid as string)
    const pCollection = client.parseCollection(collection)

    const isDefault = dflt === "1"

    const template = collection.template
    const html = template ? (await manager.prepare(template, { collection:pCollection, item })) : null
    return {
        props: { collection, item, html, isDefault },
    }
}