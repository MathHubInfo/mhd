import { resetServerContext } from "react-beautiful-dnd"
import type { DocumentContext } from "next/document"
import Document, { Html, Head, Main, NextScript } from "next/document"

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx)
    // Support react-beautiful-dnd SSR properly
    // See https://github.com/atlassian/react-beautiful-dnd/blob/67b96c8d04f64af6b63ae1315f74fc02b5db032b/docs/api/reset-server-context.md
    resetServerContext()
    return { ...initialProps }
  }

  render() {
    return (
      <Html>
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument