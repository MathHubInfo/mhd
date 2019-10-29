import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import * as serviceWorker from './serviceWorker';


// load the required fonts
require('typeface-cormorant-garamond');
require('typeface-cormorant-unicase');
require('typeface-montserrat');

// load custom styles
require('./css/bootstrapMHD.scss');
require('katex/dist/katex.min.css');

// load font-awesome
require('@fortawesome/fontawesome-free/js/all.js');


// and render the app
ReactDOM.render(<BrowserRouter><App results_loading_delay={200} /></BrowserRouter>, document.getElementById('app'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
