// src/services/eventStatsUpdater.js
// Service to update user statistics based on completed events

import { collection, query, getDocs, doc, updateDoc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import firebaseService from './firebaseService';

class EventStatsUpdater {
  /**
   * Update user statistics for events that have passed
   * This function should be called periodically (e.g., every hour)
   */
  async updateCompletedEventStats() {
    try {
      console.log('Starting event stats update process...');
      
      // Get all bookings that are confirmed but not yet processed for stats
      const bookingsRef = collection(db, 'bookings');
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      
      // Simplified query to avoid composite index issues
      // We'll filter by status and date on the client side instead
      const q = query(
        bookingsRef,
        orderBy('eventDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      // Filter bookings on the client side to avoid composite index issues
      const filteredBookings = querySnapshot.docs.filter(doc => {
        const booking = doc.data();
        // Check if status is 'confirmed'
        if (booking.status !== 'confirmed') {
          return false;
        }
        
        // Check if event date is before 6 hours ago
        let eventDate = booking.eventDate;
        if (booking.eventDate && typeof booking.eventDate.toDate === 'function') {
          eventDate = booking.eventDate.toDate();
        } else if (booking.eventDate && booking.eventDate.seconds) {
          eventDate = new Date(booking.eventDate.seconds * 1000);
        }
        
        return eventDate < sixHoursAgo;
      });
      
      console.log(`Found ${filteredBookings.length} bookings to process for stats update`);
      
      // Group bookings by user
      const userBookings = {};
      filteredBookings.forEach((doc) => {
        const booking = doc.data();
        const userId = booking.userId;
        
        // Check if stats have already been processed for this booking
        if (!booking.statsProcessed) {
          if (!userBookings[userId]) {
            userBookings[userId] = [];
          }
          userBookings[userId].push({
            id: doc.id,
            ...booking
          });
        }
      });
      
      console.log(`Processing stats for ${Object.keys(userBookings).length} users`);
      
      // Process each user's bookings
      for (const userId in userBookings) {
        await this.updateUserStats(userId, userBookings[userId]);
      }
      
      console.log('Event stats update process completed successfully');
    } catch (error) {
      console.error('Error updating event stats:', error);
    }
  }
  
  /**
   * Update statistics for a specific user based on their completed bookings
   * @param {string} userId - The user ID
   * @param {Array} bookings - Array of booking objects
   */
  async updateUserStats(userId, bookings) {
    try {
      console.log(`Updating stats for user ${userId} with ${bookings.length} bookings`);
      
      // Get current user statistics
      let currentStats = await this.getUserCurrentStats(userId);
      
      // If no stats exist, initialize them
      if (!currentStats) {
        await firebaseService.initializeUserStatistics(userId);
        currentStats = {
          totalRuns: 0,
          totalDistance: 0,
          currentStreak: 0,
          longestStreak: 0
        };
      }
      
      // Calculate new stats based on bookings
      // Total runs = number of booked slots/tickets
      let newTotalRuns = currentStats.totalRuns + bookings.length;
      
      // Distance = total runs * 2km (as per user requirement in Dashboard.jsx)
      let newTotalDistance = newTotalRuns * 2;
      
      // Find the most recent event date for streak calculation
      let lastRunDate = currentStats.lastRunDate;
      if (bookings.length > 0) {
        const latestBookingDate = bookings.reduce((latest, booking) => {
          const bookingDate = booking.eventDate instanceof Date ? 
            booking.eventDate : new Date(booking.eventDate);
          return !latest || bookingDate > latest ? bookingDate : latest;
        }, null);
        
        // Use the more recent of current lastRunDate and latest booking date
        if (!lastRunDate || (latestBookingDate && latestBookingDate > lastRunDate)) {
          lastRunDate = latestBookingDate;
        }
      }
      
      // Mark each booking as processed for stats
      for (const booking of bookings) {
        await this.markBookingAsProcessed(booking.id);
      }
      
      // Calculate streaks based on Sunday events
      const { currentStreak, longestStreak } = await this.calculateStreaks(
        userId, 
        lastRunDate, 
        currentStats.currentStreak || 0, 
        currentStats.longestStreak || 0
      );
      
      // Update user statistics in Firestore
      const statsUpdate = {
        totalRuns: newTotalRuns,
        totalDistance: parseFloat(newTotalDistance.toFixed(1)),
        lastRunDate: lastRunDate,
        currentStreak: currentStreak,
        longestStreak: longestStreak,
        updatedAt: new Date()
      };
      
      await firebaseService.updateUserStatistics(userId, statsUpdate);
      
      console.log(`Successfully updated stats for user ${userId}:`, statsUpdate);
    } catch (error) {
      console.error(`Error updating stats for user ${userId}:`, error);
    }
  }
  
  /**
   * Get current user statistics
   * @param {string} userId - The user ID
   * @returns {Object|null} Current statistics or null if not found
   */
  async getUserCurrentStats(userId) {
    try {
      const statsRef = doc(db, 'userStatistics', userId);
      const statsDoc = await getDoc(statsRef);
      
      if (statsDoc.exists()) {
        return statsDoc.data();
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting stats for user ${userId}:`, error);
      return null;
    }
  }
  
  /**
   * Calculate current and longest streaks based on Sunday events
   * @param {string} userId - The user ID
   * @param {Date} lastRunDate - The date of the last run
   * @param {number} currentStreak - Current streak count
   * @param {number} longestStreak - Longest streak count
   * @returns {Object} Updated streak counts
   */
  async calculateStreaks(userId, lastRunDate, currentStreak, longestStreak) {
    try {
      if (!lastRunDate) {
        return { currentStreak: 0, longestStreak: Math.max(longestStreak, 0) };
      }
      
      // Get the most recent Sunday (events happen every Sunday)
      const getLastSunday = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
      };
      
      // Get this week's Sunday
      const thisSunday = getLastSunday(new Date());
      
      // Get last week's Sunday
      const lastWeekSunday = new Date(thisSunday);
      lastWeekSunday.setDate(lastWeekSunday.getDate() - 7);
      
      // Normalize last run date to the Sunday of that week
      const lastRunSunday = getLastSunday(lastRunDate);
      
      // If the last run was this Sunday or last Sunday, maintain or increment the streak
      if (lastRunSunday.getTime() === thisSunday.getTime()) {
        // Last run was this Sunday, streak is maintained
        return { 
          currentStreak: Math.max(currentStreak, 1), 
          longestStreak: Math.max(longestStreak, currentStreak) 
        };
      } else if (lastRunSunday.getTime() === lastWeekSunday.getTime()) {
        // Last run was last Sunday, increment streak
        const newCurrentStreak = currentStreak + 1;
        return { 
          currentStreak: newCurrentStreak, 
          longestStreak: Math.max(longestStreak, newCurrentStreak) 
        };
      } else {
        // Last run was not this Sunday or last Sunday, reset streak
        return { 
          currentStreak: 0, 
          longestStreak: Math.max(longestStreak, currentStreak) 
        };
      }
    } catch (error) {
      console.error(`Error calculating streaks for user ${userId}:`, error);
      // Return current values if calculation fails
      return { currentStreak, longestStreak };
    }
  }
  
  /**
   * Mark a booking as processed for stats
   * @param {string} bookingId - The booking ID
   */
  async markBookingAsProcessed(bookingId) {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        statsProcessed: true,
        statsProcessedAt: new Date()
      });
    } catch (error) {
      console.error(`Error marking booking ${bookingId} as processed:`, error);
    }
  }
}

// Export singleton instance
const eventStatsUpdater = new EventStatsUpdater();
export default eventStatsUpdater;