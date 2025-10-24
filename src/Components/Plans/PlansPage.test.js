import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PlansPage from './PlansPage';

// Mock the DashboardNav component
jest.mock('../DashboardNav/DashboardNav', () => {
  return function MockDashboardNav() {
    return <div data-testid="dashboard-nav">Dashboard Navigation</div>;
  };
});

// Mock the Plans component
jest.mock('../Plans/Plans', () => {
  return function MockPlans() {
    return <div data-testid="plans-component">Plans Component</div>;
  };
});

describe('PlansPage', () => {
  test('renders without crashing', () => {
    render(
      <BrowserRouter>
        <PlansPage />
      </BrowserRouter>
    );
    
    // Check if the main container is rendered
    expect(screen.getByTestId('plans-page')).toBeInTheDocument();
    
    // Check if DashboardNav is rendered
    expect(screen.getByTestId('dashboard-nav')).toBeInTheDocument();
    
    // Check if Plans component is rendered
    expect(screen.getByTestId('plans-component')).toBeInTheDocument();
  });
});