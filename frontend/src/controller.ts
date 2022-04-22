/**
 * This file contains mappings between semantic routes and URLs.
 * It takes into account SINGLE_COLLECTION_MODE
 */

export const appTitle = process.env.NEXT_PUBLIC_APP_TITLE
export const appBranding = process.env.NEXT_PUBLIC_APP_BRANDING

export const isProduction = process.env.NODE_ENV === "production"

export const singleCollection = process.env.NEXT_PUBLIC_SINGLE_COLLECTION_MODE ?? ""
export const isSingleCollectionMode = !!singleCollection

export const homePerPage = ((value: string) => {
    const num = parseInt(value, 10)
    return isFinite(num) ? num : 10
})(process.env.NEXT_PUBLIC_HOME_PER_PAGE)

export function CollectionProvenance(slug: string) {
    if (isSingleCollectionMode) return "/provenance/"
    return `/collection/${slug}/provenance/`
}

export function CollectionIndex(slug: string) {
    if (isSingleCollectionMode) return "/"
    return `/collection/${slug}/`
}

export function Home(no: number): string {
    if (isSingleCollectionMode) return "/" // unsupported
    return `/home/${no}/`
}

export function Item(slug: string, uuid: string) {
    if (isSingleCollectionMode) return `/item/${uuid}`
    return `/item/${slug}/${uuid}/`
}

export function Index() {
    return "/"
}

export function About() {
    return "/about/"
}

export function Debug() {
    return "/debug/"
}

export function DjangoAdmin() {
    return "/api/admin/"
}