import React, { Component } from 'react';
import { Container, Row, Col, Button, ButtonGroup, FormGroup, Label, Input } from 'reactstrap';
import ZooFilters from './ZooFilters';
/* DATA */
import collectionsData from './collectionsData.json';
/* UTIL */
import {sortedKeys} from './util.js';
import {ZooInfoButton} from './ZooReusables';

const getCollectionsKeys = (objects) => {
    if (objects === null) return [];
    else return Object.keys(collectionsData[objects]);
}

export default class ZooSearch extends Component {
    
    constructor(props) {
        super(props);
        this.state = {
            collections: [],
            selectedFilters: "{}",
            counter: 0
        };
        this.passParameters = this.passParameters.bind(this);
    }

    componentDidUpdate = (pp, ps) => {
        const s = this.state
        const objects = this.props.objects
        // ok to just compare strings, the objects are sorted and numeric comparisons standardized
        const objectsChanged = (objects !== ps.objects) && (typeof ps.objects !== 'undefined')
        if (objectsChanged || JSON.stringify(s.collections) !== JSON.stringify(ps.collections) || s.selectedFilters !== ps.selectedFilters) {
            const filters = JSON.parse(s.selectedFilters);
            const keys = sortedKeys(filters); 
            const queryJSON = {
                objects: objects,
                collections: s.collections,
                filters: keys.map((k) => ({name: k, value: String(filters[k])}))
            }
            this.props.postData('/count', queryJSON).then(data => {
                this.setState({counter: data.value})
            }).catch(error => console.error(error));
        }
    }
    
    chooseObjects = (newChosenObjects) => {
        const previousChosenObjects = this.props.objects;
        if (newChosenObjects === previousChosenObjects) { return; }
        this.props.passObjects(newChosenObjects);
        
        var newState = {
            collections: getCollectionsKeys(newChosenObjects),
            selectedFilters: "{}",
            counter: 0
        }
        this.setState(newState);
    }
    
    toggleCollection = (c) => {
        var newList = this.state.collections.slice(0); // clone
        var i = newList.indexOf(c);
            
        if (i > -1) newList.splice(i, 1);
        else newList.push(c);
        
        this.setState({collections: newList});
    }
    
    updateFilters = (jsonString) => {
        this.setState({selectedFilters: jsonString});
    }
    
    passParameters = () => {
        const s = this.state
        const filters = JSON.parse(s.selectedFilters);
        const keys = sortedKeys(filters);
        var queryFilters = keys.map((k) => ({name: k, value: String(filters[k])}))
        var queryJSON = {
            objects: this.props.objects,
            collections: s.collections,
            filters: queryFilters
        }
        this.props.passParameters({counter: this.state.counter, parameters: JSON.stringify(queryJSON)});
    }
    
    render() {
        return (
            <section className="bg-primary" id="search">
                <Container id="zoo-search-box">
                    <Row>
                        <Col lg="3" md="3" sm="12" className="mx-auto my-4" id="select-type">
                            <h2 className="section-heading text-white" id="step2">Search</h2>
                            <ZooChooseObjects
                                objects={this.props.objects}
                                collections={this.state.collections}
                                chooseObjects={(o) => this.chooseObjects(o)}
                                toggleCollection={(c) => this.toggleCollection(c)} />
                        </Col>
                        <ZooFilters
                            objects={this.props.objects}
                            filters={this.state.selectedFilters}
                            callback={(s) => this.updateFilters(s)} />
                    </Row>
                    { !(this.props.objects === null) &&
                        <React.Fragment>
                            <hr className="my-2" />
                            <Row>
                                <Col lg="8" className="text-white">
                                    <p>Matches found: <i>{this.state.counter}</i></p>
                                    <div className="buttons">
                                        <Button onClick={this.passParameters.bind(this)}>Display results</Button>
                                    </div>
                                </Col>
                            </Row>
                        </React.Fragment>
                    }
                </Container>
            </section>
        );
    }
}


/* * * * * * * * * * * * * * * * * * * * * * * * *
    Handling the choice of objects
 * * * * * * * * * * * * * * * * * * * * * * * * */
class ZooChooseObjects extends Component {
    
    renderButton(value, label) {
        return(
            // default color="secondary"
            <Button
                key={value}
                className={"zoo-radio-objects" + (this.props.objects === value ? " focus" : "")}
                onClick={() => this.props.chooseObjects(value)}>
                {label} <ZooInfoButton value="type" />
            </Button>
        );
    }
    
    render() {
        var objList = Object.keys(collectionsData).map((key) => {
            return this.renderButton(key, key.charAt(0).toUpperCase() + key.slice(1));
        })
        return(
            <React.Fragment>
                <ButtonGroup id="zoo-choose-objects">{objList}</ButtonGroup>
                <div className="mx-auto my-4">
                    {!(this.props.objects === null) &&
                        <ZooChooseCollections
                            objects={this.props.objects}
                            collections={this.props.collections}
                            toggle={(c) => this.props.toggleCollection(c)} />
                    }
                </div>
            </React.Fragment>
        );
    }
}

/* * * * * * * * * * * * * * * * * * * * * * * * *
    Handling the choice of collections
 * * * * * * * * * * * * * * * * * * * * * * * * */
class ZooChooseCollections extends Component {
    
    renderCollection(c) {
        const isChecked = this.props.collections.indexOf(c.id) > -1;
        return (
            <Label check key={c.id} className="text-white" onClick={() => this.props.toggle(c.id)}>
                <Input type="checkbox" defaultChecked={isChecked} /> {c.name}
            </Label>
        );
    }

    render() {
        var availableCollectionsKeys = getCollectionsKeys(this.props.objects)
        if (this.props.objects === null) { return <p className="text-white">Choose a type of objects to start.</p>; }
        if (availableCollectionsKeys.length > 0) {
            return(
                <FormGroup check>
                    {availableCollectionsKeys.map((key) => {
                        return this.renderCollection(collectionsData[this.props.objects][key]);
                    })}
                </FormGroup>
            );
        }
    }

}