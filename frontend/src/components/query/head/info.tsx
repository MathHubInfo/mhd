import { faCommentDots } from "@fortawesome/free-regular-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Link from "next/link"
import * as React from "react"
import LaTeX from "react-latex"
import { Button } from "reactstrap"
import type { TMHDCollection } from "../../../client/rest"
import { CollectionProvenance } from "../../../controller"
import { ShareThisPage } from "../../wrappers/share"

type CollectionInfoProps = {
    collection: TMHDCollection
}

export default class CollectionInfo extends React.Component<CollectionInfoProps> {
    render() {
        const { metadata, slug, description } = this.props.collection
        return <>
            <p style={{ textAlign: "justify" }}><LaTeX>{description}</LaTeX></p>

            {metadata && <>
                <Link href={CollectionProvenance(slug)} passHref>
                    <a target="_blank" rel="noopener noreferrer">
                        <Button>
                            <FontAwesomeIcon transform="shrink-2" icon={faCommentDots} />&nbsp;
                            More about this dataset
                        </Button>
                    </a>
                </Link>
                {" "}
            </>}
            <ShareThisPage />
        </>
    }
}