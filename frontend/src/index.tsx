import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

// load font-awesome
require('@fortawesome/fontawesome-free/js/all.js');

ReactDOM.render(<BrowserRouter>
    <App results_loading_delay={200} />
</BrowserRouter>, document.getElementById('app'));
