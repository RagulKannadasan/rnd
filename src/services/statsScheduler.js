// src/services/statsScheduler.js
// Service to schedule periodic updates of user statistics

import eventStatsUpdater from './eventStatsUpdater';

class StatsScheduler {
  constructor() {
    this.intervalId = null;
    this.isActive = false;
  }

  /**
   * Start the scheduler to update stats periodically
   * @param {number} intervalMinutes - How often to run the update (in minutes)
   */
  start(intervalMinutes = 60) {
    if (this.isActive) {
      console.log('Stats scheduler is already running');
      return;
    }

    console.log(`Starting stats scheduler with ${intervalMinutes} minute interval`);
    
    // Run immediately on start
    this.runUpdate();
    
    // Set up interval for periodic updates
    this.intervalId = setInterval(() => {
      this.runUpdate();
    }, intervalMinutes * 60 * 1000); // Convert minutes to milliseconds
    
    this.isActive = true;
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isActive = false;
      console.log('Stats scheduler stopped');
    }
  }

  /**
   * Run the stats update process
   */
  async runUpdate() {
    try {
      console.log('Running scheduled stats update...');
      await eventStatsUpdater.updateCompletedEventStats();
      console.log('Scheduled stats update completed');
    } catch (error) {
      console.error('Error in scheduled stats update:', error);
    }
  }

  /**
   * Check if the scheduler is active
   * @returns {boolean} Whether the scheduler is active
   */
  isRunning() {
    return this.isActive;
  }
}

// Export singleton instance
const statsScheduler = new StatsScheduler();
export default statsScheduler;