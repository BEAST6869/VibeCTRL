import React, { useState, useEffect } from 'react';
import { 
  ACTION_TYPES, 
  ACTION_DESCRIPTIONS, 
  DEFAULT_ACTION_PARAMS,
  loadMappings,
  saveMappings,
  validateMappings,
  getDefaultMapping
} from '../utils/actions';

const MappingEditor = ({ labels = [], onMappingsChange = null }) => {
  const [mappings, setMappings] = useState({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load mappings on component mount or when labels change
  useEffect(() => {
    const loadedMappings = loadMappings(labels);
    setMappings(loadedMappings);
    setHasUnsavedChanges(false);
    
    if (onMappingsChange) {
      onMappingsChange(loadedMappings);
    }
  }, [labels, onMappingsChange]);

  // Handle action type change for a label
  const handleActionChange = (label, actionType) => {
    const newMappings = {
      ...mappings,
      [label]: {
        action: actionType,
        params: { ...DEFAULT_ACTION_PARAMS[actionType] }
      }
    };
    
    setMappings(newMappings);
    setHasUnsavedChanges(true);
    
    if (onMappingsChange) {
      onMappingsChange(newMappings);
    }
  };

  // Handle parameter change for a label's action
  const handleParamChange = (label, paramKey, paramValue) => {
    const newMappings = {
      ...mappings,
      [label]: {
        ...mappings[label],
        params: {
          ...mappings[label].params,
          [paramKey]: paramValue
        }
      }
    };
    
    setMappings(newMappings);
    setHasUnsavedChanges(true);
    
    if (onMappingsChange) {
      onMappingsChange(newMappings);
    }
  };

  // Save mappings to localStorage
  const handleSave = () => {
    const validation = validateMappings(mappings);
    
    if (!validation.isValid) {
      alert(`Cannot save mappings: ${validation.errors.join(', ')}`);
      return;
    }
    
    if (validation.warnings.length > 0) {
      const proceed = window.confirm(
        `Warning: ${validation.warnings.join(', ')}\n\nDo you want to save anyway?`
      );
      if (!proceed) return;
    }
    
    if (saveMappings(mappings)) {
      setHasUnsavedChanges(false);
      alert('Gesture mappings saved successfully!');
    }
  };

  // Reset to default mappings
  const handleReset = () => {
    if (hasUnsavedChanges) {
      const proceed = window.confirm('You have unsaved changes. Are you sure you want to reset to defaults?');
      if (!proceed) return;
    }
    
    const defaultMappings = getDefaultMapping(labels);
    setMappings(defaultMappings);
    setHasUnsavedChanges(true);
    
    if (onMappingsChange) {
      onMappingsChange(defaultMappings);
    }
  };

  // Render parameter inputs based on action type
  const renderParameterInputs = (label, mapping) => {
    if (!mapping || !mapping.action) return null;
    
    const { action, params } = mapping;
    
    switch (action) {
      case ACTION_TYPES.SCROLL_DOWN:
      case ACTION_TYPES.SCROLL_UP:
        return (
          <div className="param-input">
            <label>Pixels:</label>
            <input
              type="number"
              min="50"
              max="1000"
              step="50"
              value={params.pixels || DEFAULT_ACTION_PARAMS[action].pixels}
              onChange={(e) => handleParamChange(label, 'pixels', parseInt(e.target.value) || 0)}
              placeholder="300"
            />
          </div>
        );
        
      case ACTION_TYPES.KEY_PRESS:
        return (
          <div className="param-input">
            <label>Key:</label>
            <select
              value={params.key || DEFAULT_ACTION_PARAMS[action].key}
              onChange={(e) => handleParamChange(label, 'key', e.target.value)}
            >
              <option value="ArrowLeft">← Arrow Left</option>
              <option value="ArrowRight">→ Arrow Right</option>
              <option value="ArrowUp">↑ Arrow Up</option>
              <option value="ArrowDown">↓ Arrow Down</option>
              <option value="Space">Space</option>
              <option value="Enter">Enter</option>
              <option value="Escape">Escape</option>
              <option value="Tab">Tab</option>
              <option value="Backspace">Backspace</option>
              <option value="Delete">Delete</option>
            </select>
          </div>
        );
        
      case ACTION_TYPES.SWIPE_LEFT:
      case ACTION_TYPES.SWIPE_RIGHT:
        return (
          <div className="param-input">
            <label>Key:</label>
            <select
              value={params.key || DEFAULT_ACTION_PARAMS[action].key}
              onChange={(e) => handleParamChange(label, 'key', e.target.value)}
            >
              <option value="ArrowLeft">← Arrow Left</option>
              <option value="ArrowRight">→ Arrow Right</option>
              <option value="ArrowUp">↑ Arrow Up</option>
              <option value="ArrowDown">↓ Arrow Down</option>
              <option value="Space">Space</option>
              <option value="PageUp">Page Up</option>
              <option value="PageDown">Page Down</option>
            </select>
          </div>
        );
        
      case ACTION_TYPES.CLICK_SELECTOR:
        return (
          <div className="param-input">
            <label>CSS Selector:</label>
            <input
              type="text"
              value={params.selector || DEFAULT_ACTION_PARAMS[action].selector}
              onChange={(e) => handleParamChange(label, 'selector', e.target.value)}
              placeholder="button, .class, #id"
            />
          </div>
        );
        
      case ACTION_TYPES.TOGGLE_VIDEO:
      case ACTION_TYPES.NOOP:
      default:
        return null;
    }
  };

  if (labels.length === 0) {
    return (
      <div className="mapping-editor">
        <div className="no-labels">
          <p>No gesture labels available. Train a model first to configure mappings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mapping-editor">
      <div className="mapping-header">
        <h3>Gesture Action Mapping</h3>
        <p>Configure what actions to perform when gestures are recognized</p>
        
        <div className="mapping-controls">
          <button
            className="toggle-button"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '▲ Hide Mappings' : '▼ Show Mappings'}
          </button>
          
          {hasUnsavedChanges && (
            <div className="unsaved-indicator">
              ● Unsaved changes
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="mapping-content">
          <div className="mapping-list">
            {labels.map(label => {
              const mapping = mappings[label] || { action: ACTION_TYPES.NOOP, params: {} };
              
              return (
                <div key={label} className="mapping-item">
                  <div className="label-info">
                    <div className="label-name">{label}</div>
                    <div className="label-arrow">→</div>
                  </div>
                  
                  <div className="action-config">
                    <div className="action-select">
                      <select
                        value={mapping.action}
                        onChange={(e) => handleActionChange(label, e.target.value)}
                        className="action-dropdown"
                      >
                        {Object.values(ACTION_TYPES).map(actionType => (
                          <option key={actionType} value={actionType}>
                            {ACTION_DESCRIPTIONS[actionType]}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="action-params">
                      {renderParameterInputs(label, mapping)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mapping-actions">
            <button 
              className="save-button"
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
            >
              💾 Save Mappings
            </button>
            
            <button 
              className="reset-button"
              onClick={handleReset}
            >
              🔄 Reset to Defaults
            </button>
          </div>
          
          <div className="mapping-help">
            <h4>Action Types:</h4>
            <ul>
              <li><strong>Scroll page down/up:</strong> Smooth scroll by specified pixels</li>
              <li><strong>Toggle video:</strong> Play/pause first video element on page</li>
              <li><strong>Send keyboard key:</strong> Dispatch keyboard event</li>
              <li><strong>Click element:</strong> Find and click element by CSS selector</li>
              <li><strong>No action:</strong> Do nothing when gesture is recognized</li>
            </ul>
            
            <h4>Example Selectors:</h4>
            <ul>
              <li><code>button</code> - First button element</li>
              <li><code>.play-btn</code> - Element with class "play-btn"</li>
              <li><code>#submit</code> - Element with ID "submit"</li>
              <li><code>[data-action="next"]</code> - Element with data-action attribute</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default MappingEditor;