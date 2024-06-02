import React from 'react';
import { Link } from 'react-router-dom';

const Breadcrumb = ({ workflowId }) => {
  return (
    <div>
      <Link to="/workflows">Workflows</Link> {'>'} {workflowId}
    </div>
  );
};

export default Breadcrumb;
