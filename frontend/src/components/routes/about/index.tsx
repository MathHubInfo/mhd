import React from 'react';
import { Container } from "reactstrap";
import MHDMain from "../../common/MHDMain";

/** Renders a collection that is not found */
export default class MHDAboutPage extends React.Component {
    render() {
        return <MHDMain title="About">
            <Container>
                <p><b>MathHub Data</b> provides dataset hosting and a searchable interface 
                    for the hosted datasets.
                    It is part of <a href="https://mathhub.info/">MathHub</a>, 
                a portal for active mathematical documents and an archive for flexiformal mathematics.
                It is developed at the 
                Research Group of the Professorship for Knowledge Representation and Processing
                at <a href="https://fau.de/">FAU Erlangen-Nürnberg</a> (department 
                of <a href="https://cs.fau.de/">Computer Science</a>), also known 
                as <a href="https://kwarc.info/">KWARC</a>.
                People currently involved are Katja Berčič, Michael Kohlhase, Florian Rabe, and Tom Wiesing.</p>
                <p>For more information, see the <a href="https://docs.mathhub.info/data/">documentation</a>.</p>
                
                <p>We encourage you to get in touch if you are interested in hosting your data 
                    at <b>MathHub Data</b> the best way to do it is to get in touch with one the 
                    editors (<a href="http://kwarc.info/people/kbercic/">Katja Berčič</a> and <a href="http://kwarc.info/people/mkohlhase/">Michael Kohlhase</a>).
                    You are also welcome to read the description of the <a href="https://docs.mathhub.info/data/overview/submission-editorial.html">submission process</a>.</p>

                <h4>What is FAIR?</h4>
                <p>FAIR are guiding principles for scientific data management and stewardship.
                    They stand for Findable, Accessible, Interoperable and Reusable.
                    You can learn more at the <a href="https://www.go-fair.org/fair-principles/">GO FAIR website</a> or 
                    in the <a href="http://www.nature.com/articles/sdata201618">original publication</a>.</p>
            </Container>
        </MHDMain>;
    }
}