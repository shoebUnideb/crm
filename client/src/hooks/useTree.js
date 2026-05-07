import { useReducer, useEffect } from 'react'
import { treeReducer, initialState } from '../store/treeReducer.js'
import { ADD_CHILD, DELETE_NODE, EDIT_NODE, SELECT_NODE, DESELECT } from '../store/treeActions.js'

function loadTree(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key))
    if (saved?.nodes && saved?.rootId) return { ...saved, selectedNodeId: null }
  } catch (_) {}
  return initialState
}

export function useTree(userId) {
  const treeKey = `chart-to-jira-tree-${userId}`

  const [state, dispatch] = useReducer(treeReducer, undefined, () => loadTree(treeKey))

  useEffect(() => {
    try {
      localStorage.setItem(treeKey, JSON.stringify({ nodes: state.nodes, rootId: state.rootId }))
    } catch (_) {}
  }, [state.nodes, state.rootId, treeKey])

  return {
    state,
    addChild: (parentId) => dispatch({ type: ADD_CHILD, parentId }),
    deleteNode: (nodeId) => dispatch({ type: DELETE_NODE, nodeId }),
    editNode: (nodeId, title) => dispatch({ type: EDIT_NODE, nodeId, title }),
    selectNode: (nodeId) => dispatch({ type: SELECT_NODE, nodeId }),
    deselect: () => dispatch({ type: DESELECT }),
  }
}
