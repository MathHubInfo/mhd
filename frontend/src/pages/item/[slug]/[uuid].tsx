import type { GetServerSideProps } from "next";
import React from "react";
import { MHDBackendClient } from "../../../client";
import { TMHDCollection, TMHDItem } from "../../../client/rest";
import MHDItemView from "../../../components/routes/item/item";


interface ItemPageProps {
    collection: TMHDCollection,
    item: TMHDItem<{}>,
}


export default function ItemPage({ collection, item }: ItemPageProps) {
    return <MHDItemView collection={MHDBackendClient.getInstance().parseCollection(collection)} item={item} />;
}

export const getServerSideProps: GetServerSideProps = async function ({ params: { slug, uuid } }) {
    const [collection, item] = await MHDBackendClient.getInstance().fetchCollectionAndItem(slug as string, uuid as string);

    return {
        props: { collection, item }, // will be passed to the page component as props
    }
}