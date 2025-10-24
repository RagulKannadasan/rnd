import React from 'react';
import './Mention.css';

const Mention = ({ username }) => {
  return (
    <span className="mention">@{username}</span>
  );
};

export default Mention;