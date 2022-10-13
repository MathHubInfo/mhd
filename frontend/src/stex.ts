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

    return await fetch(FragementEndpoint + uri).then(r => r.text())
}