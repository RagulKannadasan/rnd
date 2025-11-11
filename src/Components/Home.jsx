import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import Hero from './Hero/Hero';
import Plans from './Plans/Plans';
import Programs from './Programs/Programs';
import AboutData from './About/AboutData';
import Testimonials from './Testimonials/Testimonials';
import Contact from './Contact/Contact';
import Footer from './Footer/Footer';
import Popup from './Popup/Popup';

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, redirect to dashboard
        navigate('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className="App">
      <Popup />
      <Hero />
      <Programs />
      <AboutData />
      <div id="plans-section">
        <Plans />
      </div>
      <Testimonials />
      <Contact />
      <Footer />
    </div>
  );
};

export default Home;