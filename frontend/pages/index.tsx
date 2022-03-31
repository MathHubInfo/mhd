import { default as Home, getServerSideProps as pageServerSideProps} from "./home/[no]";

// TODO: For now, we just re-render the home page on this page.
// Consider if we want to redirect here!

export default Home;

export async function getServerSideProps(context) {
    return pageServerSideProps({ ...context, params: {no: "1"}});
}