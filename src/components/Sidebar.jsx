import React from 'react';
import { Sun, Edit3 } from 'lucide-react';

const Sidebar = ({ selectedNode, onSave }) => {
  if (!selectedNode) {
    return (
      <aside id="panel">
        <div className="sidebar-card">
          <div className="card-content">
            <h3>Architecture Documentation</h3>
            <p>Interactive component visualization</p>
          </div>
          <div className="theme-toggle">
            <Sun size={20} className="sun-icon" />
          </div>
        </div>
        <div className="breadcrumb-bar">
          <span>Root</span>
        </div>
        <div className="empty-selection">
          <p>Select a node to view details</p>
        </div>
      </aside>
    );
  }

  const { name, description } = selectedNode.data;

  return (
    <aside id="panel">
      <div className="sidebar-card">
        <div className="card-content">
          <h3>Architecture Documentation</h3>
          <p>Interactive component visualization</p>
        </div>
        <div className="theme-toggle">
          <div className="sun-circle">
            <Sun size={20} className="sun-icon" />
          </div>
        </div>
      </div>
      
      <div className="breadcrumb-bar">
        <span>Root</span>
      </div>

      <div className="node-details">
        <h2 className="node-title">{name}</h2>
        <div className="section-header">
          <span className="summary-label">SUMMARY:</span>
          <button className="edit-btn">
            <Edit3 size={14} />
            <span>Edit</span>
          </button>
        </div>
        <p className="node-description">
          {description || "No description available."}
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
