import React, { Component } from 'react';
import { Container, Row, Col, Button } from 'reactstrap';
import ZooFilters from './ZooFilters';
import settings from './config/settings.json';
/* UTIL */
import {getQueryURI, sortedKeys} from './util.js';
import {ZooInfoButton} from './ZooReusables';

const getProperties = (collection) => {
    if (collection) {
        if (collection.properties) return collection.properties;
        else return {};
    }
    else return {};
}

export default class ZooSearch extends Component {
    
    constructor(props) {
        super(props);
        this.state = {
            filters: "[]",
            counter: 0
        };
        this.passParameters = this.passParameters.bind(this);
        this.fetchData = () => {
            console.log("search fetchData")
            const getCounter = (newData) => {
                console.log("search callback")
                var newState = {counter: newData.count};
                this.setState(newState);
            }
            this.props.fetchData(getCounter, "/query/", this.state.filters)
        }
//        const queryJSON = getQueryURI(this.state.collections, this.state.filters);
//        this.props.postData('/count', queryJSON).then(data => {
//            this.setState({counter: data.value})
//        }).catch(error => console.error(error));
    }

    componentDidUpdate = (pp, ps) => {
        if (!pp.collection && this.props.collection !== null) {
            this.fetchData();
        }
        // ok to just compare strings, the objects are sorted and numeric comparisons standardized
        if (this.state.filters !== ps.filters)
        {
            this.passParameters();
            this.fetchData();
        }
    }
    
    updateFilters = (jsonString) => {
        this.setState({filters: jsonString});
    }
    
    passParameters = () => {
        this.props.passParameters(this.state);
    }
    
    render() {
        return (
            <section className="bg-primary" id="search">
                <Container id="zoo-search-box">
                    { !(this.props.collection === null) &&
                    <Row>
                        <Col lg="3" md="3" sm="12" className="mx-auto my-4" id="select-type">
                            <h2 className="section-heading text-white" id="step2">{settings.title}</h2>                 
                            <p>{this.props.collection.displayName}</p>
                            <p>Matches found: <i>{this.state.counter}</i></p>
                            <div className="buttons">
                                <Button onClick={this.passParameters.bind(this)}>Display results</Button>
                            </div>
                        </Col>
                        <ZooFilters
                            collection={this.props.collection}
                            properties={getProperties(this.props.collection)}
                            callback={(s) => this.updateFilters(s)} />
                    </Row>
                    }
                </Container>
            </section>
        );
    }
}