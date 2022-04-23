import { resetServerContext } from "react-beautiful-dnd"
import type { DocumentContext } from "next/document"
import Document, { Html, Head, Main, NextScript } from "next/document"
import { join } from "path"
import { readFile } from "fs"
import renderHTMLAsReact from "../templates/html"
import { footerContentFilename } from "../controller"

export default class MyDocument extends Document<{footer: string|null}>{
  static async getInitialProps(ctx: DocumentContext) {
    const path = footerContentFilename ? join(process.cwd(), footerContentFilename) : null

      const [
        initialProps,
        footer,
      ] = await Promise.all([
        Document.getInitialProps(ctx),
        path ? (new Promise((rs, rj) => readFile(path, (err, data) => !err ? rs(data.toString()) : rj(err)))) : null,
      ])
    
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
          <Main />å
          <NextScript />
          {footer && renderHTMLAsReact(footer)}
        </body>
      </Html>
    )
  }
}
