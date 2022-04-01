import { AppProps } from "next/app";

// load the required fonts
import "typeface-cormorant-garamond";
import "typeface-cormorant-unicase";
import "typeface-montserrat";

// load custom styles
import "../src/css/bootstrapMHD.scss";
import "katex/dist/katex.min.css";

// load font-awesome
import "@fortawesome/fontawesome-free/js/all.js";


import MHDHeader from "../src/components/common/MHDHeader";
import MHDFooter from "../src/components/common/MHDFooter";

export default function MHDApp({ Component, pageProps }: AppProps<{}>) {
    return <>
        <header><MHDHeader /></header>
        <Component {...pageProps} />
        <footer><MHDFooter /></footer>
    </>
}