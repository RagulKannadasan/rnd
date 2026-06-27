import React from 'react';
import './QRScanner.css';

const QRInfo = () => {
  return (
    <div className="qr-info-container">
      <h2>QR Code Information</h2>
      
      <div className="info-section">
        <h3>How QR Codes Work</h3>
        <p>
          QR codes are used to quickly access ticket information for events. Each ticket 
          generated for an event contains a unique QR code that stores booking details.
        </p>
        
        <h3>Scanning Tickets</h3>
        <p>
          To scan a ticket:
        </p>
        <ol>
          <li>Navigate to the QR Scanner section in the admin panel</li>
          <li>Point your device's camera at the QR code on the ticket</li>
          <li>The system will automatically read the code and display ticket details</li>
          <li>Verify the information matches the attendee</li>
        </ol>
        
        <h3>Ticket Information</h3>
        <p>
          Each QR code contains the following information:
        </p>
        <ul>
          <li>Booking ID</li>
          <li>Event name and date</li>
          <li>Attendee name</li>
          <li>Contact information</li>
          <li>Booking status</li>
        </ul>
        
        <h3>Security</h3>
        <p>
          QR codes are unique to each booking and cannot be duplicated. If a code appears 
          invalid or tampered with, contact the system administrator.
        </p>
      </div>
    </div>
  );
};

export default QRInfo;