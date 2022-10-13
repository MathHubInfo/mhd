import { resetServerContext } from "react-beautiful-dnd"
import type { DocumentContext } from "next/document"
import Document, { Html, Head, Main, NextScript } from "next/document"
import { join } from "path"
import { readFileSync } from "fs"
import { footerContentFilename } from "../controller"
import HTMLReactParser from "html-react-parser"

const path = footerContentFilename ? join(process.cwd(), footerContentFilename) : null
const footer = path ? readFileSync(path).toString() : null

export default class MyDocument extends Document<{ footer: string | null }>{
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx)
    // Support react-beautiful-dnd SSR properly
    // See https://github.com/atlassian/react-beautiful-dnd/blob/67b96c8d04f64af6b63ae1315f74fc02b5db032b/docs/api/reset-server-context.md
    resetServerContext()
    return { ...initialProps, footer }
  }

  render() {
    const { footer } = this.props

    return (
      <Html>
        <Head />
        <body>
          <Main />
          <NextScript />
          {footer && HTMLReactParser(footer)}
        </body>
      </Html>
    )
  }
}
