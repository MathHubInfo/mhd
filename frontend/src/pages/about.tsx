import React from "react"
import { Container } from "reactstrap"
import MHDMain from "../components/common/MHDMain"
import { aboutPageFilename } from "../controller"
import { readFile } from "fs"
import { join } from "path"
import HTMLReactParser from "html-react-parser"

export default function MHDAboutPage({ html } : { html: string }) {
    return <MHDMain title="About">
        <Container>
            {HTMLReactParser(html)}
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