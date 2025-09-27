import React, { useState, useEffect, useRef } from 'react';
import { 
  ACTION_TYPES, 
  ACTION_DESCRIPTIONS, 
  DEFAULT_ACTION_PARAMS,
  loadMappings,
  saveMappings,
  validateMappings,
  getDefaultMapping,
  canTrigger,
  executeMappedAction,
  getOrCreateUserId,
  importMappings as importMappingsUtil,
  exportMappings as exportMappingsUtil
} from '../utils/actions';
import BrutalButton from '../ui/brutal/BrutalButton';
import BrutalInput from '../ui/brutal/BrutalInput';

const MappingEditor = ({ labels = [], onMappingsChange = null, userId: providedUserId = null }) => {
  const [mappings, setMappings] = useState({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [userId, setUserId] = useState(providedUserId || null);
  const fileInputRef = useRef(null);

// Init user id and load mappings on mount/labels change
useEffect(() => {
  const id = providedUserId || getOrCreateUserId();
  setUserId(id);
  const loadedMappings = loadMappings(labels, id);
  setMappings(loadedMappings);
  setHasUnsavedChanges(false);
  if (onMappingsChange) onMappingsChange(loadedMappings);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [labels]);

  // Handle action type change for a label
const handleActionChange = (label, actionType) => {
  const newMappings = {
    ...mappings,
    [label]: {
      action: actionType,
      params: { ...DEFAULT_ACTION_PARAMS[actionType] },
      lastTriggered: mappings[label]?.lastTriggered || 0
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

// Save mappings to localStorage (per user)
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
  if (saveMappings(mappings, userId)) {
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
  if (onMappingsChange) onMappingsChange(defaultMappings);
};

// Import/Export handlers
const handleExport = () => {
  const payload = exportMappingsUtil(mappings, userId);
  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const el = document.createElement('a');
  el.href = url;
  el.download = `vibectrl-mappings-${userId}-${ts}.json`;
  document.body.appendChild(el);
  el.click();
  document.body.removeChild(el);
  URL.revokeObjectURL(url);
};

const handleImportClick = () => fileInputRef.current?.click();

const handleImportFile = (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = importMappingsUtil(reader.result);
      if (Object.keys(imported).length === 0) {
        alert('Invalid mapping JSON');
        return;
      }
      setMappings(imported);
      setHasUnsavedChanges(true);
      if (onMappingsChange) onMappingsChange(imported);
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    } finally {
      e.target.value = '';
    }
  };
  reader.readAsText(file);
};

// Quick test execution per mapping
const handleTest = (label) => {
  const mapping = mappings[label];
  if (!mapping) return;
  if (canTrigger(mapping)) {
    executeMappedAction(mapping);
    // force re-render so "last" timestamp reflects immediately
    setMappings({ ...mappings });
  } else {
    console.log('⏱️ Cooldown/anti-spam active; test suppressed');
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
            <BrutalInput.Input
              type="number"
              min="50"
              max="1000"
              step="50"
              value={params.pixels || DEFAULT_ACTION_PARAMS[action].pixels}
              onChange={(e) => handleParamChange(label, 'pixels', parseInt(e.target.value) || 0)}
              placeholder="300"
              aria-label={`Scroll pixels for ${label}`}
            />
          </div>
        );
        
      case ACTION_TYPES.VOLUME_UP:
      case ACTION_TYPES.VOLUME_DOWN:
        return (
<div className="param-input">
            <label>Volume Change:</label>
            <BrutalInput.Input
              type="number"
              min="0.01"
              max="0.5"
              step="0.01"
              value={params.amount || DEFAULT_ACTION_PARAMS[action].amount}
              onChange={(e) => handleParamChange(label, 'amount', parseFloat(e.target.value) || 0.1)}
              placeholder="0.1"
              aria-label={`Volume delta for ${label}`}
            />
          </div>
        );
        
      case ACTION_TYPES.KEY_PRESS:
        return (
          <div className="param-input">
            <label>Key:</label>
<BrutalInput.Select
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
</BrutalInput.Select>
          </div>
        );
        
      case ACTION_TYPES.SWIPE_LEFT:
      case ACTION_TYPES.SWIPE_RIGHT:
        return (
          <div className="param-input">
            <label>Key:</label>
<BrutalInput.Select
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
</BrutalInput.Select>
          </div>
        );
        
      case ACTION_TYPES.CLICK_SELECTOR:
        return (
          <div className="param-input">
            <label>CSS Selector:</label>
<BrutalInput.Input
              type="text"
              value={params.selector || DEFAULT_ACTION_PARAMS[action].selector}
              onChange={(e) => handleParamChange(label, 'selector', e.target.value)}
              placeholder="button, .class, #id"
              aria-label={`CSS selector for ${label}`}
            />
          </div>
        );
        
      case ACTION_TYPES.TOGGLE_VIDEO:
      case ACTION_TYPES.TAB_NEXT:
      case ACTION_TYPES.TAB_PREV:
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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 800 }}>User: {userId || 'loading...'}</span>
          <BrutalButton
            className="toggle-button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label="Toggle mapping visibility"
          >
            {isExpanded ? '▲ Hide Mappings' : '▼ Show Mappings'}
          </BrutalButton>
          {hasUnsavedChanges && (
            <div className="unsaved-indicator">● Unsaved changes</div>
          )}
          <BrutalButton variant="outline" onClick={handleExport} aria-label="Export mappings JSON">
            Export JSON
          </BrutalButton>
          <BrutalButton variant="outline" onClick={handleImportClick} aria-label="Import mappings JSON">
            Import JSON
          </BrutalButton>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
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
                      <BrutalInput.Select
                        value={mapping.action}
                        onChange={(e) => handleActionChange(label, e.target.value)}
                        className="action-dropdown"
                        aria-label={`Select action for ${label}`}
                      >
                        {Object.values(ACTION_TYPES).map(actionType => (
                          <option key={actionType} value={actionType}>
                            {ACTION_DESCRIPTIONS[actionType]}
                          </option>
                        ))}
                      </BrutalInput.Select>
                    </div>
                    
                    <div className="action-params">
                      {renderParameterInputs(label, mapping)}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                      <BrutalButton variant="outline" onClick={() => handleTest(label)} aria-label={`Test ${label} mapping`}>
                        Test
                      </BrutalButton>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                        last: {mapping.lastTriggered ? new Date(mapping.lastTriggered).toLocaleTimeString() : 'never'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mapping-actions">
<BrutalButton 
              className="save-button"
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
            >
              💾 Save Mappings
            </BrutalButton>
            
            <BrutalButton 
              className="reset-button"
              variant="outline"
              onClick={handleReset}
            >
              🔄 Reset to Defaults
            </BrutalButton>
          </div>
          
          <div className="mapping-help">
            <h4>Action Types:</h4>
            <ul>
              <li><strong>Scroll page down/up:</strong> Smooth scroll by specified pixels</li>
              <li><strong>Toggle video:</strong> Play/pause all media elements on page</li>
              <li><strong>Increase/Decrease volume:</strong> Control volume of all media elements</li>
              <li><strong>Switch to next/previous tab:</strong> Navigate browser tabs</li>
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