import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';

// Define the order of the swipeable routes representing the main navigation tabs
const SWIPEABLE_ROUTES = [
  '/dashboard',
  '/community',
  '/user-events',
  '/plans',
  '/fitness'
];

const SwipeableLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      // Swiping left moves to the next tab in the array
      const currentIndex = SWIPEABLE_ROUTES.indexOf(location.pathname);
      if (currentIndex !== -1 && currentIndex < SWIPEABLE_ROUTES.length - 1) {
        navigate(SWIPEABLE_ROUTES[currentIndex + 1]);
      }
    },
    onSwipedRight: () => {
      // Swiping right moves to the previous tab in the array
      const currentIndex = SWIPEABLE_ROUTES.indexOf(location.pathname);
      if (currentIndex !== -1 && currentIndex > 0) {
        navigate(SWIPEABLE_ROUTES[currentIndex - 1]);
      }
    },
    trackTouch: true,
    trackMouse: false,
    delta: 50, // Require at least 50px of movement to trigger a swipe
    swipeDuration: 500, // Maximum time (ms) for a swipe to be recognized
  });

  // Check if we are currently on one of the swipeable routes
  const isSwipeableRoute = SWIPEABLE_ROUTES.includes(location.pathname);

  if (!isSwipeableRoute) {
    return <>{children}</>;
  }

  return (
    <div {...handlers} style={{ width: '100%', height: '100%', minHeight: '100vh', overflowX: 'hidden' }}>
      {children}
    </div>
  );
};

export default SwipeableLayout;
