import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Payments from './Payments';

// Mock Firebase auth and db
jest.mock('../../firebase', () => ({
  auth: {
    onAuthStateChanged: jest.fn()
  },
  db: {}
}));

// Mock useNavigate and useLocation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    state: null
  })
}));

// Mock jsPDF to avoid TextEncoder issues in test environment
jest.mock('jspdf', () => {
  return {
    jsPDF: jest.fn().mockImplementation(() => {
      return {
        setFontSize: jest.fn(),
        setTextColor: jest.fn(),
        text: jest.fn(),
        rect: jest.fn(),
        save: jest.fn()
      };
    })
  };
});

// Mock QRCodeCanvas to avoid rendering issues in tests
jest.mock('qrcode.react', () => ({
  QRCodeCanvas: () => <div data-testid="qr-code">QR Code</div>
}));

describe('Payments Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    // Mock the onAuthStateChanged to return a function
    require('../../firebase').auth.onAuthStateChanged.mockImplementation((callback) => {
      // Don't call the callback immediately to keep the loading state
      return () => {}; // Return unsubscribe function
    });
    
    render(
      <BrowserRouter>
        <Payments />
      </BrowserRouter>
    );
    
    // Check if loading message is displayed
    expect(screen.getByText('Loading payment information...')).toBeInTheDocument();
  });
});