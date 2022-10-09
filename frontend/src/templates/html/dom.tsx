import { DOMParser, XMLSerializer } from "@xmldom/xmldom"

const parser = new DOMParser()

/**
 * Parses a string containing html into a list of nodes
 * @param code String containing html
 */
export function parseHTMLNodes(code: string): NodeListOf<Node> {
    // parse a new html document from a string
    const newDocument = parser.parseFromString(`<div>${code}</div>`, "text/html")

    // we check if thhe document was parsed correctly by checking that the first child is a <div>
    // if this is not the case we did not have valid {code} and instead return an empty nodelist
    if (newDocument.childNodes.length !== 1 || newDocument.childNodes[0].nodeName.toLowerCase() !== "div")
        return parser.parseFromString("<div />", "text/html").childNodes[0].childNodes

    // if valid, return the document as is
    return newDocument.childNodes[0].childNodes
}

/** createElement creates a new element */
export function createElement(name: string): Element {
    const nodes = parseHTMLNodes("<div />")[0]
    return nodes.ownerDocument.createElement(name)
}

const serializer = new XMLSerializer()

/**
 * Gets the outer html for a node
 * @param node Node to get outer html from
 */
export function outerHTML(node: NodesLike): string {
    return asNodeArray(node).map(node => serializer.serializeToString(node)).join("")
}

/**
 * innerHTML returns the innerHTML of node
 * @param node 
 * @returns 
 */
export function innerHTML(node: NodesLike): string {
    return outerHTML(isArrayLike(node) ? node : node.childNodes)
}

// queryAll finds all nodes in a subtree that match the given predicate
function queryAll(node: NodesLike, pred: (node: Node) => boolean): Array<Node> {
    let nodes = asNodeArray(node)
    const results = []
    while (nodes.length > 0) {
        const [next] = nodes.splice(0, 1)
        if (pred(next)) results.push(next)

        const children = Array.from(next.childNodes ?? [])
        nodes = nodes.concat(children)
    }
    return results
}

/*
// query find the first node that matches the given predicate
function query(node: NodesLike, pred: (node: Node) => boolean): Node | null {
    let nodes = asNodeArray(node)
    while (nodes.length > 0) {
        const [next] = nodes.splice(0, 1)
        if (pred(next)) return next

        const children = Array.from(next.childNodes ?? [])
        nodes = nodes.concat(children)
    }
    return null
}
*/

/** findElementsByTagName finds all elements inside a */
export function findElementsByTagName(node: Node | ArrayLike<Node>, name: string): Element[] {
    return queryAll(node, (n) => n.nodeType === ELEMENT_NODE && (n as Element).tagName === name) as Element[]
}


type NodesLike = Node | ArrayLike<Node>
function asNodeArray(node: NodesLike): Array<Node> {
    return isArrayLike(node) ? Array.from(node) : [node]
}

function isArrayLike(obj: any): obj is ArrayLike<any> {
    if (Array.isArray(obj)) return true

    // check for HTMLCollection and NodeList
    const name = Object.prototype.toString.call(obj)
    if (name === "[object HTMLCollection]" || name === "[object NodeList]") return true

    if(typeof obj !== "object" && !obj.hasOwnProperty("length") && obj.length < 0) return false
    return obj.length === 0 || (obj[0] && obj[0].nodeType)
}


const d = parser.parseFromString("<div />", "text/html")
export const ATTRIBUTE_NODE = d.ATTRIBUTE_NODE
export const CDATA_SECTION_NODE = d.CDATA_SECTION_NODE
export const COMMENT_NODE = d.COMMENT_NODE
export const DOCUMENT_FRAGMENT_NODE = d.DOCUMENT_FRAGMENT_NODE
export const DOCUMENT_NODE = d.DOCUMENT_NODE
export const DOCUMENT_POSITION_CONTAINED_BY = d.DOCUMENT_POSITION_CONTAINED_BY
export const DOCUMENT_POSITION_CONTAINS = d.DOCUMENT_POSITION_CONTAINS
export const DOCUMENT_POSITION_DISCONNECTED = d.DOCUMENT_POSITION_DISCONNECTED
export const DOCUMENT_POSITION_FOLLOWING = d.DOCUMENT_POSITION_FOLLOWING
export const DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC = d.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC
export const DOCUMENT_POSITION_PRECEDING = d.DOCUMENT_POSITION_PRECEDING
export const DOCUMENT_TYPE_NODE = d.DOCUMENT_TYPE_NODE
export const ELEMENT_NODE = d.ELEMENT_NODE
export const ENTITY_NODE = d.ENTITY_NODE
export const ENTITY_REFERENCE_NODE = d.ENTITY_REFERENCE_NODE
export const NOTATION_NODE = d.NOTATION_NODE
export const PROCESSING_INSTRUCTION_NODE = d.PROCESSING_INSTRUCTION_NODE
export const TEXT_NODE = d.TEXT_NODE
