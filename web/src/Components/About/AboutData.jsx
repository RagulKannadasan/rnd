import './AboutData.css';

const AboutData = () => {
  return (
    <div className="AboutData" id="about">
      <div className="details-r">
        <div className="about-heading">
          <span className="stroke-text">ABOUT</span> <span>US</span>
        </div>

        <div className="about-text">
          <span>R & D is more than a club — it's a space where movement meets meaning.</span>
          <br />
          <span>
            We combine the energy of running with the power of ideas, creating a unique platform
            for innovators, entrepreneurs, and changemakers to connect, reflect, and grow.
          </span>
        </div>
        
        <div className="business-description">
          <h2>About Our Fitness Community</h2>
          <p>We are a fitness event management platform connecting running enthusiasts 
          in the community. We organize weekly running events, provide fitness tracking 
          tools, and facilitate event bookings.</p>
          
          <h3>Our Services</h3>
          <ul>
            <li>Community Running Events</li>
            <li>Fitness Tracking Tools</li>
            <li>Event Booking and Management</li>
            <li>Training and Wellness Programs</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AboutData;