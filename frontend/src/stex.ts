import { findElementsByTagName, innerHTML, parseHTMLNodes } from "./templates/html/dom"

/**
 * This file defines STeX endpoints
 */

const Base = process.env.NEXT_PUBLIC_STEX_PUBLIC_URL
export const Enabled = Base != ""
const FragementEndpoint = Base + "fragment?"
const DisplayEndpoint = Base + "symbol?"

/** displayLink gives the display link for the given mmt URI  */
export function displayLink(uri: string) : string {
    return DisplayEndpoint + uri
}

/** fetchFragment fetches a fragment for the given MMT URI */
export async function fetchFragment(uri: string): Promise<string> {
    if (!Enabled) return ""

    console.log(FragementEndpoint + uri)
    const result = await fetch(FragementEndpoint + uri).then(r => r.text())

    const fragment = parseHTMLNodes(result)
    const body: ArrayLike<Node> = findElementsByTagName(fragment, "body")
    return body.length == 1 ? innerHTML(body[0]) : innerHTML(fragment)
}