/**
 * This file contains mappings between semantic routes and URLs.
 * It takes into account SINGLE_COLLECTION_MODE
 */

export const appTitle = process.env.NEXT_PUBLIC_APP_TITLE
export const appBranding = process.env.NEXT_PUBLIC_APP_BRANDING

const aboutPage = process.env.NEXT_PUBLIC_ABOUT_PAGE || null
const aboutPageURL = (aboutPage !== null && aboutPage.includes(":")) ? aboutPage : null
export const aboutPageFilename = (aboutPage !== null && !aboutPage.includes(":")) ? aboutPage : null

export const footerContentFilename = process.env.NEXT_PUBLIC_FOOTER_PAGE || null

export const isProduction = process.env.NODE_ENV === "production"

export const singleCollection = process.env.NEXT_PUBLIC_SINGLE_COLLECTION_MODE || null

export const homePerPage = ((value: string) => {
    const num = parseInt(value, 10)
    return isFinite(num) ? num : 10
})(process.env.NEXT_PUBLIC_HOME_PER_PAGE)

export function CollectionProvenance(slug: string) {
    if (singleCollection !== null) return "/provenance/"
    return `/collection/${slug}/provenance/`
}

export function CollectionIndex(slug: string) {
    if (singleCollection !== null) return "/"
    return `/collection/${slug}/`
}

export function Home(no: number): string {
    if (singleCollection !== null) return "/" // unsupported
    return `/home/${no}/`
}

export function Item(slug: string, uuid: string) {
    if (singleCollection !== null) return `/item/${uuid}`
    return `/item/${slug}/${uuid}/`
}

export function Index() {
    return "/"
}

export function AboutInternal() {
    return aboutPageFilename !== null ? "/about/" : null
}

export function AboutExternal() {
    return aboutPageURL !== null ? aboutPageURL : null
}

export function Debug() {
    return "/debug/"
}

export function DjangoAdmin() {
    return "/api/admin/"
}