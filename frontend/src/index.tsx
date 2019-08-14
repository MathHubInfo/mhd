import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { api } from './config';

ReactDOM.render(<App api={api} results_loading_delay={200} />, document.getElementById('app'));
