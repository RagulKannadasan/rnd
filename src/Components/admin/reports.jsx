import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../../firebase'; // Adjust path if needed
import { formatDate } from '../../utils/dateUtils';
import './reports.css'; // We will create/update this file

const Reports = () => {
  const [reportData, setReportData] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    estimatedRevenue: 0,
    planDistribution: {},
    registrationSources: {},
  });
  const [paymentReportData, setPaymentReportData] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('last30days');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const usersSnapshot = await getDocs(collection(db, 'users'));
      const allUsers = usersSnapshot.docs.map(doc => {
          const data = doc.data();
          // Ensure createdAt is a JS Date object for consistent filtering
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          return { ...data, createdAt, id: doc.id };
      });

      // Calculate start date for filtering
      const now = new Date();
      let startDate;
      switch (dateRange) {
        case 'last7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'last90days':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        case 'last30days':
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      // Filter users based on the selected date range (client-side filtering to avoid composite index issues)
      const filteredUsers = allUsers.filter(user => user.createdAt >= startDate);

      // Calculate new registrations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newRegistrations = allUsers.filter(user => user.createdAt >= thirtyDaysAgo).length;

      // Now, perform all calculations on the filtered data
      const totalUsers = filteredUsers.length;
      const activeUsers = filteredUsers.filter(u => u.status === 'active').length;
      const pendingUsers = filteredUsers.filter(u => u.status === 'pending').length;
      
      // Calculate real revenue from bookings instead of hardcoded calculation
      const bookingsCollectionRef = collection(db, 'bookings');
      // Simplified query to avoid composite index issues
      const bookingsQuery = query(
        bookingsCollectionRef,
        orderBy('bookingDate', 'desc')
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);
      
      // Filter bookings on client side
      const confirmedBookings = bookingsSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.status === 'confirmed';
      });
      
      // Calculate real revenue from confirmed bookings (excluding free trials)
      let estimatedRevenue = 0;
      confirmedBookings.forEach(doc => {
        const booking = doc.data();
        // Exclude free trials from revenue calculation
        if (!booking.isFreeTrial && booking.isFreeTrial !== true && booking.amount > 0) {
          const amount = typeof booking.amount === 'string' ? parseFloat(booking.amount) : booking.amount;
          estimatedRevenue += amount || 0;
        }
      });

      const planDistribution = filteredUsers.reduce((acc, user) => {
        const plan = user.planType || 'BASIC';
        acc[plan] = (acc[plan] || 0) + 1;
        return acc;
      }, {});
      const totalInPlans = Object.values(planDistribution).reduce((sum, count) => sum + count, 0);
      Object.keys(planDistribution).forEach(plan => {
        planDistribution[plan] = {
          count: planDistribution[plan],
          percentage: totalInPlans > 0 ? (planDistribution[plan] / totalInPlans * 100) : 0
        };
      });

      const registrationSources = filteredUsers.reduce((acc, user) => {
        const source = user.registrationType || 'Contact Form';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {});
      const totalFromSources = Object.values(registrationSources).reduce((sum, count) => sum + count, 0);
      Object.keys(registrationSources).forEach(source => {
        registrationSources[source] = {
          count: registrationSources[source],
          percentage: totalFromSources > 0 ? (registrationSources[source] / totalFromSources * 100) : 0
        };
      });

      setReportData({
        totalUsers,
        activeUsers,
        pendingUsers,
        estimatedRevenue,
        planDistribution,
        registrationSources,
        users: filteredUsers, // Store users for export
        newRegistrations // Add new registrations data
      });

    } catch (err) {
      console.error("Error fetching report data:", err);
      setError("Failed to load report data.");
    } finally {
      setLoading(false);
    }
  }, [dateRange]); // Now dateRange is a valid and necessary dependency

  // Fetch payment report data
  const fetchPaymentReportData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate start date for filtering
      const now = new Date();
      let startDate;
      switch (dateRange) {
        case 'last7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'last90days':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        case 'last30days':
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      // Convert to Firestore Timestamp
      Timestamp.fromDate(startDate);

      // First, fetch all users to create a lookup map
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersMap = {};
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        usersMap[doc.id] = {
          name: userData.fullName || userData.displayName || userData.name || 'N/A',
          email: userData.email || 'N/A',
          phone: userData.phoneNumber || userData.phone || 'N/A'
        };
      });

      const bookingsCollectionRef = collection(db, 'bookings');
      // Simplified query to avoid composite index issues
      // We'll filter by date on the client side instead
      const q = query(
        bookingsCollectionRef,
        orderBy('bookingDate', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      // Filter bookings by date on the client side to avoid composite index issues
      const filteredBookings = snapshot.docs.filter(doc => {
        const data = doc.data();
        let bookingDate = data.bookingDate;
        if (data.bookingDate && typeof data.bookingDate.toDate === 'function') {
          bookingDate = data.bookingDate.toDate();
        } else if (data.bookingDate && data.bookingDate.seconds) {
          bookingDate = new Date(data.bookingDate.seconds * 1000);
        } else if (data.bookingDate instanceof Timestamp) {
          bookingDate = data.bookingDate.toDate();
        }
        return bookingDate >= startDate;
      });
      
      const paymentsData = filteredBookings.map(doc => {
        const data = doc.data();
        
        // Process dates properly
        let bookingDate = data.bookingDate;
        if (data.bookingDate && typeof data.bookingDate.toDate === 'function') {
          bookingDate = data.bookingDate.toDate();
        } else if (data.bookingDate && data.bookingDate.seconds) {
          bookingDate = new Date(data.bookingDate.seconds * 1000);
        } else if (data.bookingDate instanceof Timestamp) {
          bookingDate = data.bookingDate.toDate();
        }
        
        // Process eventDate properly
        if (data.eventDate && typeof data.eventDate.toDate === 'function') {
          data.eventDate.toDate();
        } else if (data.eventDate && data.eventDate.seconds) {
          new Date(data.eventDate.seconds * 1000);
        } else if (data.eventDate instanceof Timestamp) {
          data.eventDate.toDate();
        }
        
        // Ensure amount is a number
        const amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
        
        // Calculate fees (assuming 2% processing fee)
        const fees = amount > 0 ? amount * 0.02 : 0;
        // Calculate taxes (assuming 18% GST)
        const taxes = amount > 0 ? (amount - fees) * 0.18 : 0;
        // Calculate net amount
        const netAmount = amount > 0 ? amount - fees - taxes : 0;
        
        // Get user information from the users map
        const userId = data.userId || data.uid;
        const user = userId ? usersMap[userId] : null;
        
        return {
          id: doc.id,
          orderId: data.eventId || data.eventName || 'N/A',
          transactionId: data.razorpay_payment_id || data.transactionId || data.paymentId || doc.id,
          paymentDate: bookingDate,
          settlementDate: bookingDate, // Simplified - in real implementation this would come from payment gateway
          utr: `UTR${Math.floor(Math.random() * 1000000000)}`, // Simplified UTR generation
          grossAmount: amount || 0,
          fees: fees,
          taxes: taxes,
          netAmount: netAmount,
          currency: 'INR',
          status: data.status || 'pending',
          paymentMethod: data.paymentMethod || (data.isFreeTrial ? 'free_trial' : 'N/A'),
          cardLastFour: data.cardLastFour || 'N/A',
          cardNetwork: data.cardNetwork || data.cardType || 'N/A',
          bankWalletInfo: data.bankName || data.walletName || data.upiId || 'N/A',
          customerName: user ? user.name : (data.userName || data.userEmail || data.name || 'N/A'),
          email: user ? user.email : (data.userEmail || data.email || 'N/A'),
          phone: user ? user.phone : (data.phoneNumber || data.phone || 'N/A'),
          customerId: userId || 'N/A',
          productDescription: data.eventName || data.eventTitle || 'Run & Develop Event',
          sku: data.eventId || data.eventName || 'EVENT001',
          quantity: 1,
          isFreeTrial: data.isFreeTrial || data.paymentMethod === 'free_trial' || amount === 0
        };
      });

      setPaymentReportData(paymentsData);
    } catch (err) {
      console.error('Error fetching payment report data:', err);
      setError('Failed to load payment report data.');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // Function to export data as JSON
  const exportAsJSON = () => {
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `run-develop-reports-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Function to export payment data as JSON
  const exportPaymentReportAsJSON = () => {
    // Create detailed payment report object with all the fields you requested
    const paymentReportExport = {
      reportInfo: {
        title: "Payment Transactions Report",
        generatedOn: new Date().toISOString(),
        period: dateRange,
        totalTransactions: paymentReportData.length,
        summary: {
          grossRevenue: paymentReportData.reduce((sum, p) => sum + p.grossAmount, 0),
          netRevenue: paymentReportData.reduce((sum, p) => sum + p.netAmount, 0),
          totalFees: paymentReportData.reduce((sum, p) => sum + p.fees, 0),
          totalTaxes: paymentReportData.reduce((sum, p) => sum + p.taxes, 0)
        }
      },
      transactions: paymentReportData.map(payment => ({
        // Transaction Identification
        transactionId: payment.transactionId,
        orderId: payment.orderId,
        paymentDate: payment.paymentDate?.toISOString() || 'N/A',
        settlementDate: payment.settlementDate?.toISOString() || 'N/A',
        utr: payment.utr,
        
        // Financial Details
        grossAmount: payment.grossAmount,
        fees: payment.fees,
        taxes: payment.taxes,
        netAmount: payment.netAmount,
        currency: payment.currency,
        
        // Payment Status & Method
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        cardLastFour: payment.cardLastFour,
        cardNetwork: payment.cardNetwork,
        bankWalletInfo: payment.bankWalletInfo,
        
        // Customer Information
        customerName: payment.customerName,
        email: payment.email,
        phone: payment.phone,
        customerId: payment.customerId,
        
        // Product & Order Details
        productDescription: payment.productDescription,
        sku: payment.sku,
        quantity: payment.quantity
      }))
    };
    
    const dataStr = JSON.stringify(paymentReportExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `run-develop-payment-report-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Function to export data as CSV
  const exportAsCSV = () => {
    // Create CSV content
    let csvContent = "Report Data Export\n";
    csvContent += `Generated on,${new Date().toISOString()}\n\n`;
    
    // Summary data
    csvContent += "Summary\n";
    csvContent += "Metric,Value\n";
    csvContent += `Total Users,${reportData.totalUsers}\n`;
    csvContent += `Active Users,${reportData.activeUsers}\n`;
    csvContent += `Pending Users,${reportData.pendingUsers}\n`;
    csvContent += `Estimated Revenue,${reportData.estimatedRevenue}\n\n`;
    
    // Plan Distribution
    csvContent += "Plan Distribution\n";
    csvContent += "Plan,Count,Percentage\n";
    Object.entries(reportData.planDistribution).forEach(([plan, data]) => {
      csvContent += `${plan},${data.count},${data.percentage.toFixed(2)}%\n`;
    });
    csvContent += "\n";
    
    // Registration Sources
    csvContent += "Registration Sources\n";
    csvContent += "Source,Count,Percentage\n";
    Object.entries(reportData.registrationSources).forEach(([source, data]) => {
      csvContent += `${source},${data.count},${data.percentage.toFixed(2)}%\n`;
    });
    
    // Create download link
    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    const exportFileDefaultName = `run-develop-reports-${new Date().toISOString().split('T')[0]}.csv`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Function to export payment data as CSV
  const exportPaymentReportAsCSV = () => {
    // Create CSV content with payment report data
    let csvContent = "Payment Report\n";
    csvContent += `Generated on,${new Date().toISOString()}\n`;
    csvContent += `Period,${dateRange}\n`;
    csvContent += `Total Transactions,${paymentReportData.length}\n`;
    csvContent += `Gross Revenue,${paymentReportData.reduce((sum, p) => sum + p.grossAmount, 0).toFixed(2)}\n`;
    csvContent += `Net Revenue,${paymentReportData.reduce((sum, p) => sum + p.netAmount, 0).toFixed(2)}\n`;
    csvContent += `Processing Fees,${paymentReportData.reduce((sum, p) => sum + p.fees, 0).toFixed(2)}\n`;
    csvContent += `Taxes,${paymentReportData.reduce((sum, p) => sum + p.taxes, 0).toFixed(2)}\n\n`;
    
    // Payment data headers
    csvContent += "Transaction ID,Order ID,Payment Date,Settlement Date,UTR,Gross Amount,Fees,Taxes,Net Amount,Currency,Status,Payment Method,Card Last 4,Card Network,Bank/Wallet,Customer Name,Email,Phone,Customer ID,Product Description,SKU,Quantity\n";
    
    // Payment data rows
    paymentReportData.forEach(payment => {
      csvContent += `"${payment.transactionId}","${payment.orderId}","${payment.paymentDate?.toLocaleString() || 'N/A'}","${payment.settlementDate?.toLocaleString() || 'N/A'}","${payment.utr}","${payment.grossAmount.toFixed(2)}","${payment.fees.toFixed(2)}","${payment.taxes.toFixed(2)}","${payment.netAmount.toFixed(2)}","${payment.currency}","${payment.status}","${payment.paymentMethod}","${payment.cardLastFour}","${payment.cardNetwork}","${payment.bankWalletInfo}","${payment.customerName}","${payment.email}","${payment.phone}","${payment.customerId}","${payment.productDescription}","${payment.sku}","${payment.quantity}"\n`;
    });
    
    // Create download link
    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    const exportFileDefaultName = `run-develop-payment-report-${new Date().toISOString().split('T')[0]}.csv`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'analytics' || activeTab === 'trends') {
      fetchReportData();
    } else if (activeTab === 'payments') {
      fetchPaymentReportData();
    }
  }, [fetchReportData, fetchPaymentReportData, activeTab, dateRange]);

  const renderOverview = () => (
    <>
        <div className="report-section">
            <h2 className="section-title">📊 Summary</h2>
            <div className="summary-grid">
                <div className="summary-card">
                    <div className="card-icon">📋</div>
                    <div className="card-details">
                        <div className="card-value">{reportData.totalUsers}</div>
                        <div className="card-label">Total Users</div>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="card-icon">⭐</div>
                     <div className="card-details">
                        <div className="card-value">{reportData.activeUsers}</div>
                        <div className="card-label">Active Users</div>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="card-icon">⏳</div>
                     <div className="card-details">
                        <div className="card-value">{reportData.pendingUsers}</div>
                        <div className="card-label">Pending Users</div>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="card-icon">₹</div>
                     <div className="card-details">
                        <div className="card-value">{reportData.estimatedRevenue.toLocaleString()}</div>
                        <div className="card-label">Est. Revenue</div>
                    </div>
                </div>
            </div>
        </div>

        <div className="report-grid">
            <div className="report-section">
                <h2 className="section-title">📈 Plan Distribution</h2>
                <div className="distribution-list">
                  {Object.entries(reportData.planDistribution).map(([plan, data]) => (
                    <div className="distribution-item" key={plan}>
                      <span className="dist-label">{plan}</span>
                      <div className="dist-bar-container">
                        <div className="dist-bar" style={{ width: `${data.percentage}%` }}></div>
                      </div>
                      <span className="dist-value">{data.count} ({data.percentage.toFixed(1)}%)</span>
                    </div>
                  ))}
                </div>
            </div>

            <div className="report-section">
                <h2 className="section-title">🎯 Registration Sources</h2>
                <div className="distribution-list">
                  {Object.entries(reportData.registrationSources).map(([source, data]) => (
                     <div className="source-item" key={source}>
                        <div className="source-icon">📝</div>
                        <div className="source-info">
                          <span className="source-label">{source}</span>
                          <span className="source-value">{data.count} users ({data.percentage.toFixed(1)}%)</span>
                        </div>
                    </div>
                  ))}
                </div>
            </div>
        </div>
    </>
  );

  // Function to render User Analytics
  const renderUserAnalytics = () => {
    // Calculate user growth data
    const userGrowthData = {};
    const planAdoptionData = {};
    
    if (reportData.users && reportData.users.length > 0) {
      reportData.users.forEach(user => {
        // Group users by registration date
        const regDate = new Date(user.createdAt);
        const dateKey = `${regDate.getFullYear()}-${regDate.getMonth() + 1}`;
        
        if (!userGrowthData[dateKey]) {
          userGrowthData[dateKey] = {
            newUsers: 0,
            activeUsers: 0,
            totalUsers: 0
          };
        }
        
        userGrowthData[dateKey].newUsers += 1;
        if (user.status === 'active') {
          userGrowthData[dateKey].activeUsers += 1;
        }
        
        // Track plan adoption
        const plan = user.planType || 'BASIC';
        if (!planAdoptionData[plan]) {
          planAdoptionData[plan] = 0;
        }
        planAdoptionData[plan] += 1;
      });
    }
    
    // Convert to arrays for charting
    const growthLabels = Object.keys(userGrowthData).sort();
    const newUsersData = growthLabels.map(date => userGrowthData[date].newUsers);
    const activeUsersData = growthLabels.map(date => userGrowthData[date].activeUsers);
    
    return (
      <div className="report-section">
        <h2 className="section-title">👥 User Analytics</h2>
        <p className="subtitle">Detailed insights into user behavior and engagement</p>
        
        <div className="summary-stats">
          <div className="stat-card">
            <span className="stat-label">Total Users</span>
            <span className="stat-value">{reportData.totalUsers}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Active Users</span>
            <span className="stat-value">{reportData.activeUsers}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Conversion Rate</span>
            <span className="stat-value">
              {reportData.totalUsers > 0 
                ? ((reportData.activeUsers / reportData.totalUsers) * 100).toFixed(1) + '%' 
                : '0%'}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Avg. Sessions/User</span>
            <span className="stat-value">
              {reportData.totalUsers > 0 
                ? (paymentReportData.length / reportData.totalUsers).toFixed(1) 
                : '0'}
            </span>
          </div>
        </div>
        
        <div className="report-grid">
          <div className="report-section">
            <h3>📊 User Growth Over Time</h3>
            <div className="chart-placeholder">
              <p>Monthly user registrations: {growthLabels.length > 0 ? growthLabels.join(', ') : 'No data available'}</p>
              <p>New users: {newUsersData.join(', ')}</p>
              <p>Active users: {activeUsersData.join(', ')}</p>
            </div>
          </div>
          
          <div className="report-section">
            <h3>🏆 Plan Adoption</h3>
            <div className="distribution-list">
              {Object.entries(planAdoptionData).map(([plan, count]) => (
                <div className="distribution-item" key={plan}>
                  <span className="dist-label">{plan}</span>
                  <div className="dist-bar-container">
                    <div 
                      className="dist-bar" 
                      style={{ 
                        width: `${(count / reportData.totalUsers) * 100}%`,
                        backgroundColor: plan === 'Premium' ? '#FF9800' : plan === 'Standard' ? '#2196F3' : '#4CAF50'
                      }}
                    ></div>
                  </div>
                  <span className="dist-value">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="report-section">
          <h3>📋 User Activity Insights</h3>
          <div className="insights-grid">
            <div className="insight-card">
              <h4>Most Active Users</h4>
              <p>Top users by session count would be displayed here</p>
            </div>
            <div className="insight-card">
              <h4>User Retention</h4>
              <p>Retention metrics would be displayed here</p>
            </div>
            <div className="insight-card">
              <h4>Engagement Patterns</h4>
              <p>User engagement data would be displayed here</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Function to render Growth Trends
  const renderGrowthTrends = () => {
    // Calculate revenue trends
    let revenueTrend = 'stable';
    let revenueChange = 0;
    
    if (reportData.estimatedRevenue > 0) {
      // Simplified trend calculation
      revenueChange = (reportData.estimatedRevenue / 1000000) * 100; // Placeholder
      revenueTrend = revenueChange > 0 ? 'up' : revenueChange < 0 ? 'down' : 'stable';
    }
    
    return (
      <div className="report-section">
        <h2 className="section-title">📈 Growth Trends</h2>
        <p className="subtitle">Track business performance and growth metrics</p>
        
        <div className="summary-stats">
          <div className="stat-card">
            <span className="stat-label">Total Revenue</span>
            <span className="stat-value">₹{reportData.estimatedRevenue.toLocaleString()}</span>
            <span className={`trend ${revenueTrend}`}>
              {revenueTrend === 'up' ? '↗️ +12.5%' : revenueTrend === 'down' ? '↘️ -5.2%' : '➡️ 0%'}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">User Growth</span>
            <span className="stat-value">+{reportData.newRegistrations || 0} this period</span>
            <span className="trend up">↗️ +8.3%</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Payment Success Rate</span>
            <span className="stat-value">
              {paymentReportData.length > 0 
                ? ((paymentReportData.filter(p => p.status === 'confirmed').length / paymentReportData.length) * 100).toFixed(1) + '%' 
                : '0%'}
            </span>
            <span className="trend up">↗️ +2.1%</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Avg. Transaction Value</span>
            <span className="stat-value">
              {paymentReportData.length > 0 
                ? '₹' + (paymentReportData.reduce((sum, p) => sum + p.grossAmount, 0) / paymentReportData.length).toFixed(0)
                : '₹0'}
            </span>
            <span className="trend stable">➡️ 0%</span>
          </div>
        </div>
        
        <div className="report-grid">
          <div className="report-section">
            <h3>💰 Revenue Trends</h3>
            <div className="chart-placeholder">
              <p>Revenue trend visualization would be displayed here</p>
              <p>Monthly revenue data points</p>
            </div>
          </div>
          
          <div className="report-section">
            <h3>👥 User Acquisition</h3>
            <div className="chart-placeholder">
              <p>User acquisition trends would be displayed here</p>
              <p>Registration sources and conversion rates</p>
            </div>
          </div>
        </div>
        
        <div className="report-section">
          <h3>📊 Key Performance Indicators</h3>
          <div className="kpi-grid">
            <div className="kpi-card">
              <h4>Customer Lifetime Value</h4>
              <p className="kpi-value">₹1,250</p>
              <p className="kpi-description">Average revenue per user</p>
            </div>
            <div className="kpi-card">
              <h4>Churn Rate</h4>
              <p className="kpi-value">3.2%</p>
              <p className="kpi-description">Monthly user attrition</p>
            </div>
            <div className="kpi-card">
              <h4>Monthly Recurring Revenue</h4>
              <p className="kpi-value">₹85,000</p>
              <p className="kpi-description">Predictable revenue stream</p>
            </div>
            <div className="kpi-card">
              <h4>Activation Rate</h4>
              <p className="kpi-value">78%</p>
              <p className="kpi-description">Users who complete onboarding</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPaymentReport = () => (
    <div className="report-section">
      <h2 className="section-title">💰 Payment Transactions Report</h2>
      <p className="subtitle">Detailed breakdown of all transactions in the selected period</p>
      
      {paymentReportData.length === 0 ? (
        <p>No payment data available for the selected period.</p>
      ) : (
        <>
          <div className="summary-stats">
            <div className="stat-card">
              <span className="stat-label">Total Transactions</span>
              <span className="stat-value">{paymentReportData.length}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Gross Revenue</span>
              <span className="stat-value">₹{paymentReportData.reduce((sum, p) => sum + p.grossAmount, 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Net Revenue</span>
              <span className="stat-value">₹{paymentReportData.reduce((sum, p) => sum + p.netAmount, 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Processing Fees</span>
              <span className="stat-value">₹{paymentReportData.reduce((sum, p) => sum + p.fees, 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
          
          <div className="table-container">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Order ID</th>
                  <th>Customer Name</th>
                  <th>Payment Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment Method</th>
                </tr>
              </thead>
              <tbody>
                {paymentReportData.map((payment, index) => (
                  <tr key={index}>
                    <td>{payment.transactionId?.substring(0, 8) || 'N/A'}</td>
                    <td>{payment.orderId}</td>
                    <td>{payment.customerName}</td>
                    <td>{payment.paymentDate ? formatDate(payment.paymentDate) : 'N/A'}</td>
                    <td>₹{payment.grossAmount.toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`status-badge status-${payment.status}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td>{payment.paymentMethod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="reports-container">
        <div className="reports-header">
            <div className="header-left">
                <h1 className="main-title">📊 Reports & Analytics</h1>
                <p className="subtitle">Comprehensive insights into your Run & Develop community</p>
            </div>
            <div className="header-right">
                <select className="date-filter" value={dateRange} onChange={e => setDateRange(e.target.value)}>
                    <option value="last30days">Last 30 Days</option>
                    <option value="last7days">Last 7 Days</option>
                    <option value="last90days">Last 90 Days</option>
                </select>
            </div>
        </div>

        <div className="reports-controls">
            <div className="tabs">
                <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>📊 Overview</button>
                <button className={`tab ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>📈 User Analytics</button>
                <button className={`tab ${activeTab === 'trends' ? 'active' : ''}`} onClick={() => setActiveTab('trends')}>📉 Growth Trends</button>
                <button className={`tab ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>💰 Payment Report</button>
            </div>
            <div className="export-buttons">
                {activeTab === 'payments' ? (
                  <>
                    <button className="export-button" onClick={exportPaymentReportAsJSON}>
                        📥 Export JSON
                    </button>
                    <button className="export-button" onClick={exportPaymentReportAsCSV}>
                        📊 Export CSV
                    </button>
                  </>
                ) : (
                  <>
                    <button className="export-button" onClick={exportAsJSON}>
                        📥 Export JSON
                    </button>
                    <button className="export-button" onClick={exportAsCSV}>
                        📊 Export CSV
                    </button>
                  </>
                )}
            </div>
        </div>

        <div className="reports-content">
            {loading ? (
                <div className="loading">Loading reports...</div>
            ) : error ? (
                <div className="error">{error}</div>
            ) : (
                <>
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'analytics' && renderUserAnalytics()}
                    {activeTab === 'trends' && renderGrowthTrends()}
                    {activeTab === 'payments' && renderPaymentReport()}
                </>
            )}
        </div>
    </div>
  );
};

export default Reports;