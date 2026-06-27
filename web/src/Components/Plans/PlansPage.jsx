import React from "react";
import "./PlansPage.css";
import Plans from "../Plans/Plans";


const PlansPage = () => {
  return (
    <div className="plans-page" data-testid="plans-page">

      <div className="plans-page-content">
        <Plans />
      </div>
    </div>
  );
};

export default PlansPage;