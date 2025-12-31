import React from 'react';
import { 
  FolderOpen, 
  FolderTree, 
  ArrowDown, 
  ArrowUp, 
  Target, 
  Plus, 
  BookOpen, 
  Download 
} from 'lucide-react';

const Topbar = ({ onExpandAll, onCollapseAll, onFitView, onDrillDown, onDrillUp, onAddNode, onFullDoc }) => {
  return (
    <header className="topbar">
      <h1>NeuroMap</h1>
      <div className="button-group">
        <button className="btn btn-purple" onClick={onExpandAll}>
          <FolderOpen size={16} />
          <span>Expand All</span>
        </button>
        <button className="btn btn-yellow" onClick={onCollapseAll}>
          <FolderTree size={16} />
          <span>Collapse All</span>
        </button>
        <button className="btn btn-blue" onClick={onDrillDown}>
          <ArrowDown size={16} />
          <span>Drill Down</span>
        </button>
        <button className="btn btn-light-blue" onClick={onDrillUp}>
          <ArrowUp size={16} />
          <span>Drill Up</span>
        </button>
        <button className="btn btn-pink" onClick={onFitView}>
          <Target size={16} />
          <span>Fit View</span>
        </button>
        <button className="btn btn-teal" onClick={onAddNode}>
          <Plus size={16} />
          <span>Add Node</span>
        </button>
        <button className="btn btn-green" onClick={onFullDoc}>
          <BookOpen size={16} />
          <span>Full Documentation</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
