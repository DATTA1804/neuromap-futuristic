import React, { useState, useEffect } from 'react'
import Topbar from './components/Topbar'
import Sidebar from './components/Sidebar'
import Mindmap from './components/Mindmap'

function App() {
  const [data, setData] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [actions, setActions] = useState({})

  useEffect(() => {
    fetch('/data.json')
      .then(res => res.json())
      .then(json => {
        setData(json)
      })
  }, [])

  return (
    <div className="app-container">
      <Topbar 
        onExpandAll={actions.expandAll} 
        onCollapseAll={actions.collapseAll} 
        onFitView={actions.fitView} 
        onDrillDown={actions.drillDown}
        onDrillUp={actions.drillUp}
        onAddNode={actions.addNode}
        onFullDoc={() => alert("Opening Full Documentation...")}
      />
      <div className="main-layout">
        <Mindmap data={data} onNodeSelect={setSelectedNode} setFunctions={setActions} />
        <Sidebar selectedNode={selectedNode} onSave={(updatedNode) => {
          // Logic to update data if needed
        }} />
      </div>
    </div>
  )
}


export default App
