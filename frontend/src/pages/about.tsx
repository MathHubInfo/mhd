import React from "react"
import { Container } from "reactstrap"
import MHDMain from "../components/common/MHDMain"
import { aboutPageFilename } from "../controller"
import { readFile } from "fs"
import { join } from "path"
import renderHTMLAsReact from "../templates/html"

export default function MHDAboutPage({ html } : { html: string }) {
    return <MHDMain title="About">
        <Container>
            {renderHTMLAsReact(html)}
        </Container>
    </MHDMain>
}

export async function getStaticProps() {
    if (aboutPageFilename === null) return { notFound: true }

    const path = join(process.cwd(), aboutPageFilename)
    const html = await new Promise((rs, rj) => readFile(path, (err, data) => !err ? rs(data.toString()) : rj(err)))
    return {
        props: { html },
    }
}