import React from 'react';
import './RefundPolicy.css';

const RefundPolicy = () => {
  return (
    <div className="refund-policy-container">
      <article className="refund-policy-content">
        <header className="refund-policy-header">
          <h1>Refund Policy</h1>
          <p><strong>Last updated:</strong> January 2, 2026</p>
        </header>
        
        <main className="refund-policy-body">
          <section className="policy-section">
            <h2>About Our Business</h2>
            <p>
              Run and Develop is a fitness event management platform connecting running enthusiasts in the community. We organize weekly running events, provide fitness tracking tools, and facilitate event bookings.
            </p>
          </section>
          
          <section className="policy-section">
            <h2>Non-Refundable Payments</h2>
            <p>
              All payments made for subscriptions, plans, and services on R&D Run and Develop 
              are final and non-refundable. Once payment is processed, no refunds will be provided 
              under any circumstances.
            </p>
          </section>
          
          <section className="policy-section">
            <h2>Free Trial Period</h2>
            <p>
              We offer a free trial period to allow users to evaluate our services before making 
              any payment commitments. Please take advantage of our free trial to ensure our 
              services meet your needs and expectations.
            </p>
          </section>
          
          <section className="policy-section">
            <h2>Plan Payments</h2>
            <p>
              All plan payments are final and non-refundable. Users are responsible 
              for managing their plan subscriptions and can choose not to renew 
              when their current plan expires.
            </p>
          </section>
          
          <section className="policy-section">
            <h2>Service Changes</h2>
            <p>
              While we strive to provide consistent service quality, we reserve the right to 
              modify our services, features, and pricing with appropriate notice. Such changes 
              do not constitute grounds for refunds.
            </p>
          </section>
          
          <section className="policy-section">
            <h2>Contact Information</h2>
            <p>
              For any questions regarding this refund policy, please contact us at:
            </p>
            <p>
              Email: <a href="mailto:runanddevelop@gmail.com">runanddevelop@gmail.com</a><br />
              Instagram: <a href="https://www.instagram.com/run_and_develop" target="_blank" rel="noopener noreferrer">@run_and_develop</a>
            </p>
          </section>
          
          <aside className="policy-note">
            <p>
              <strong>Note:</strong> By making a payment on our platform, you acknowledge 
              that you have read, understood, and agree to this non-refundable policy.
            </p>
          </aside>
        </main>
      </article>
    </div>
  );
};

export default RefundPolicy;