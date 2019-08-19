import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { MemoryRouter } from 'react-router';

it('renders the homepage crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <MemoryRouter initialEntries={['/']}>
      <App results_loading_delay={200} />
    </MemoryRouter>, div);
});
