import React, { Component } from 'react';
import ZooSearch from './ZooSearch';
import ZooResults from './ZooResults';
import { Container, Row, Col } from 'reactstrap';

//import ReactDOM from 'react-dom'

export default class ZooApp extends Component {
    
    constructor(props) {
        super(props);
        this.state = {
            objects: null,
            parameters: null,
            counter: null
        };
        this.passObjects = (objects) => { this.setState({objects: objects}); }
        this.passParameters = (obj) => { this.setState(obj); }
        this.postData = (route = ``, data = {}) => {
            return fetch(this.props.api + route, {
                method: "POST",
    //                mode: "cors", // no-cors, cors, *same-origin
    //                cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    //                credentials: "same-origin", // include, *same-origin, omit
                headers: { "Content-Type": "application/json; charset=utf-8" },
    //                redirect: "follow", // manual, *follow, error
    //                referrer: "no-referrer", // no-referrer, *client
                body: JSON.stringify(data), // body data type must match "Content-Type" header
            })
            .then(response => response.json()); // parses response to JSON
        }
    }
    
    render() {
        return(
            <React.Fragment>
                <ZooSearch 
                    objects={this.state.objects}
                    postData={this.postData}
                    passObjects={this.passObjects} 
                    passParameters={this.passParameters}
                />
                {!(this.state.parameters === null) && 
                    <ZooResults 
                        objects={this.state.objects}
                        parameters={this.state.parameters}
                        counter={this.state.counter}
                        postData={this.postData}
                    />
                }
                <ZooFooter />
            </React.Fragment>
        );
    }

}

function ZooFooter() {
    return(
        <footer className="bg-dark" id="footer">
            <Container>
                <Row>
                    <Col lg="4" className="my-5 text-white">
                    </Col>
                    <Col lg="4" className="my-5 text-white">
                    </Col>
                    <Col lg="4" className="my-5 text-white">
                        
                    </Col>
                </Row>
            </Container>
        </footer>
    );
}