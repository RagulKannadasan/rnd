import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Community from './Community';

// Mock the DashboardNav component since it uses hooks
jest.mock('../DashboardNav/DashboardNav', () => {
  return function DashboardNav() {
    return <div data-testid="dashboard-nav">Dashboard Navigation</div>;
  };
});

// Mock framer-motion
jest.mock('framer-motion', () => {
  return {
    motion: {
      div: ({ children, ...props }) => <div {...props}>{children}</div>
    }
  };
});

describe('Community Component', () => {
  test('renders community feed section', () => {
    render(<Community />);
    
    // Check if the main sections are rendered
    expect(screen.getByText('Community Feed')).toBeInTheDocument();
    expect(screen.getByText('Top Runners')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Events')).toBeInTheDocument();
    
    // Check if the new post button is rendered
    expect(screen.getByText('New Post')).toBeInTheDocument();
    
    // Check if posts are rendered
    expect(screen.getByText(/Just completed my first 10K run/)).toBeInTheDocument();
    expect(screen.getByText(/Looking for running buddies/)).toBeInTheDocument();
    expect(screen.getByText(/Today's mindful running session/)).toBeInTheDocument();
  });
  
  test('toggles new post form when clicking New Post button', () => {
    render(<Community />);
    
    // Initially, the form should not be visible
    expect(screen.queryByPlaceholderText(/Share your running experience/)).not.toBeInTheDocument();
    
    // Click the New Post button
    const newPostButton = screen.getByText('New Post');
    fireEvent.click(newPostButton);
    
    // Now the form should be visible
    expect(screen.getByPlaceholderText(/Share your running experience/)).toBeInTheDocument();
    
    // Click the Cancel button
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    // The form should be hidden again
    expect(screen.queryByPlaceholderText(/Share your running experience/)).not.toBeInTheDocument();
  });
  
  test('renders sidebar sections', () => {
    render(<Community />);
    
    // Check if the sidebar sections are rendered
    expect(screen.getByText('Top Runners')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Events')).toBeInTheDocument();
    
    // Check if leaderboard items are rendered
    expect(screen.getByText('Alex Kumar')).toBeInTheDocument();
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    
    // Check if event items are rendered
    expect(screen.getByText('Weekly Group Run')).toBeInTheDocument();
    expect(screen.getByText('Mindful Running Workshop')).toBeInTheDocument();
  });
});