import React, { Component } from 'react';
import { Container, Row, Col } from 'reactstrap';
import ReactTable from 'react-table';
import ChooseColumns from './ZooColumns';
/* presenters */
import {presenters} from './presenters.js';

export default class ZooResults extends Component {
    
    constructor(props) {
        super(props);
        
        this.state = {
            columnKeys: [],
            columns: [],
            data: null,
            pages: null
        };
        
        this.fetchData = () => {
            const setResults = (newData) => { 
                console.log("results")
                console.log(newData)
                var newState = {data: newData.results};
                this.setState(newState);
            }
            this.props.fetchData(setResults, "/query/", this.props.parameters)
        }
        
        this.applyColumns = this.applyColumns.bind(this);
    }
    
    componentDidUpdate(pp, ps) {
        if (!pp.collection && this.props.collection !== null) {
            this.applyColumns(this.props.collection.properties.map((p) => p.slug))
            this.fetchData();
        }
        // ok to just compare strings, the objects are sorted and numeric comparisons standardized
        if (this.props.parameters !== pp.parameters) {
            this.fetchData();
        }
    }
    
    applyColumns(newColumns) {
        const list = newColumns;
        const colObjects = list.map((columnName) => {
            var c = this.props.collection.propertyDictionary[columnName];
            var obj = {
                Header: c.display,
                accessor: columnName
            };
            if (presenters.hasOwnProperty(c.type)) { obj.Cell = props => presenters[c.type](props.value) }
            return obj;  
        })
        
        this.setState({ 
            columnKeys: newColumns,
            columns: colObjects
        });
    }
    
    render() {
        return (
            <section id="results">
                <Container>
                    <Row>
                        <Col lg="12">
                            <div>
                                <ChooseColumns 
                                    objects={this.props.objects} 
                                    current={this.state.columnKeys} 
                                    apply={this.applyColumns}
                                />
                            </div>
                            <div className="table-responsive">
                                {this.state.data !== null &&
                                    <ReactTable manual
                                        data={this.state.data} 
                                        columns={this.state.columns}
                                        defaultPageSize={20}
                                        pages={this.state.pages}
                                        onFetchData={this.fetchData}
                                    />
                                }
                            </div>
                       </Col>
                    </Row>
                </Container>
            </section>
        );
    }
}