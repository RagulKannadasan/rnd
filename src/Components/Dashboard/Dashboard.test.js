import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from './Dashboard';

// Mock the DashboardNav component
jest.mock('../DashboardNav/DashboardNav', () => {
  return function MockDashboardNav() {
    return <div data-testid="dashboard-nav">Dashboard Navigation</div>;
  };
});

// Mock the TicketNotification component
jest.mock('./TicketNotification', () => {
  return function MockTicketNotification() {
    return <div data-testid="ticket-notification">Ticket Notification</div>;
  };
});

// Mock the firebaseService
jest.mock('../../services/firebaseService', () => ({
  default: {
    getUserStatistics: jest.fn(),
  },
}));

// Mock Firebase auth and db
jest.mock('../../firebase', () => ({
  auth: {},
  db: {},
}));

// Mock Firebase functions
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <div>{children}</div>,
}));

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaRunning: () => <div>Running Icon</div>,
  FaCalendarAlt: () => <div>Calendar Icon</div>,
  FaUsers: () => <div>Users Icon</div>,
  FaChartLine: () => <div>Chart Icon</div>,
  FaUser: () => <div>User Icon</div>,
  FaTicketAlt: () => <div>Ticket Icon</div>,
  FaTimes: () => <div>Times Icon</div>,
  FaDownload: () => <div>Download Icon</div>,
}));

// Mock qrcode.react
jest.mock('qrcode.react', () => ({
  QRCodeCanvas: () => <div>QR Code</div>,
}));

describe('Dashboard', () => {
  test('renders without crashing', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    
    // Check if the main container is rendered
    expect(screen.getByText('Dashboard Navigation')).toBeInTheDocument();
  });
});