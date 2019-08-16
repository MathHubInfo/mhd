import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

// load the required fonts
require('typeface-cormorant-garamond');
require('typeface-cormorant-unicase');
require('typeface-montserrat');

// load custom styles
require('./css/bootstrapMDH.scss');
require('react-table/react-table.css');

// load font-awesome
require('@fortawesome/fontawesome-free/js/all.js');


// and render the app
ReactDOM.render(<BrowserRouter><App results_loading_delay={200} /></BrowserRouter>, document.getElementById('app'));
