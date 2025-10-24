import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Notification from './Notification';

// Mock the CSS import
jest.mock('./Notification.css', () => ({}));

describe('Notification Component', () => {
  test('renders OTP success notification with tick icon and proper alignment', () => {
    render(
      <Notification 
        message="OTP sent successfully" 
        type="otp-success" 
        onClose={() => {}} 
      />
    );
    
    // Check that the notification is rendered
    expect(screen.getByText('OTP sent successfully')).toBeInTheDocument();
    
    // Check that the tick icon is displayed
    expect(screen.getByText('✅')).toBeInTheDocument();
    
    // Check that the correct CSS class is applied
    const notificationElement = screen.getByText('OTP sent successfully').closest('.notification');
    expect(notificationElement).toHaveClass('notification-otp-success');
  });
});