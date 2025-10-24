import React from "react";
import "./PlansPage.css";
import Plans from "../Plans/Plans";
import DashboardNav from "../DashboardNav/DashboardNav";

const PlansPage = () => {
  return (
    <div className="plans-page" data-testid="plans-page">
      <DashboardNav />
      <div className="plans-page-content">
        <Plans />
      </div>
    </div>
  );
};

export default PlansPage;