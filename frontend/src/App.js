import React, { Component } from 'react';
import ZooSearch from './ZooSearch';
import ZooResults from './ZooResults';
import { Container, Row, Col } from 'reactstrap';
import {getFilterObject} from './util.js';
/* UTIL */
import {getQueryURI} from './util.js';

export default class ZooApp extends Component {
    
    constructor(props) {
        super(props);
        this.state = {
            collection: null,
            filters: "[]",
            counter: null
        };
        this.passParameters = (obj) => { this.setState(obj); }
        const setCollection = (info) => {
            info.propertyDictionary = {};
            for (var i = 0; i < info.properties.length; i++) {
                var p = info.properties[i]
                info.propertyDictionary[p.slug] = getFilterObject(p);
            }
            this.setState({collection: info})
        }

        this.fetchData = (callback, path, filters = "[]") => {
            var maybeCollection = /\/([a-zA-Z0-9-_]+)/g.exec(window.location.pathname)
            var slug = ((!maybeCollection || maybeCollection.length !== 2) ? "" : maybeCollection[1]);
            
            var getParArr = [];
            if (filters !== "[]") getParArr.push("filter=" + getQueryURI(filters))
//            getParArr.push("filter=f0%3C0")
            getParArr.push("format=json")
            
            var getParameters = "?";
            for (var i = 0; i < getParArr.length; i++) {
                if (i > 0) getParameters += "&";
                getParameters += getParArr[i];
            }
            console.log(this.props.api + path + slug + getParameters)

            fetch(this.props.api + path + slug + getParameters, {
                method: "GET",
                headers: { "Content-Type": "application/json; charset=utf-8" } 
            })
            .then(response => {
                console.log(response);
                return response.json();
            }) // parses response to JSON
            .then(data => callback(data));
        }
        this.fetchData(setCollection, "/schema/collections/");
    }
    
    render() {
        if (this.state.colection !== null) {
            return(
                <React.Fragment>
                    <ZooSearch 
                        fetchData={this.fetchData}
                        collection={this.state.collection}
                        passParameters={this.passParameters}
                    />
                    <ZooResults
                        fetchData={this.fetchData}
                        collection={this.state.collection}
                        parameters={this.state.parameters}
                    />
                    <ZooFooter />
                </React.Fragment>
            );
        }
        else return null;
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