import React, { useState, useEffect } from 'react';
import { AIModel } from '../types';
import { getModelInfo, checkModelAvailability } from '../services/aiService';

interface AIModelSelectorProps {
  onModelChange?: (model: AIModel) => void;
  disabled?: boolean;
}

const AIModelSelector: React.FC<AIModelSelectorProps> = ({ onModelChange, disabled = false }) => {
  const [currentModel, setCurrentModel] = useState<AIModel>('gemini');
  const [modelInfo, setModelInfo] = useState(getModelInfo());
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    // Update model info when component mounts or environment changes
    setModelInfo(getModelInfo());
    setCurrentModel(getModelInfo().current);
  }, []);

  const handleModelSwitch = async (newModel: AIModel) => {
    if (newModel === currentModel || isSwitching) return;

    setIsSwitching(true);

    try {
      // Update environment variable and reload
      // Since we can't directly change process.env in the browser,
      // we'll use localStorage to persist the choice and refresh
      localStorage.setItem('preferred_ai_model', newModel);

      // Trigger a page refresh to apply the new model
      window.location.reload();
    } catch (error) {
      console.error('Failed to switch AI model:', error);
      setIsSwitching(false);
    }
  };

  const getModelDisplayName = (model: AIModel) => {
    switch (model) {
      case 'gemini':
        return 'Gemini 2.5 Flash';
      case 'glm':
        return 'GLM-4.6';
      default:
        return model;
    }
  };

  const getModelColor = (model: AIModel) => {
    switch (model) {
      case 'gemini':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'glm':
        return 'bg-purple-500 hover:bg-purple-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const availability = checkModelAvailability();

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <span>🤖</span> AI Model
        </h3>
        <span className={`text-xs px-2 py-1 rounded-full ${
          currentModel === 'gemini' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
        }`}>
          {getModelDisplayName(currentModel)}
        </span>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleModelSwitch('gemini')}
            disabled={!availability.gemini || disabled || isSwitching}
            className={`px-3 py-2 text-xs font-medium rounded-md transition-all ${
              currentModel === 'gemini'
                ? 'bg-blue-500 text-white shadow-md'
                : availability.gemini && !disabled && !isSwitching
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg">💎</span>
              <span>Gemini</span>
              {!availability.gemini && (
                <span className="text-xs text-red-500">No key</span>
              )}
            </div>
          </button>

          <button
            onClick={() => handleModelSwitch('glm')}
            disabled={!availability.glm || disabled || isSwitching}
            className={`px-3 py-2 text-xs font-medium rounded-md transition-all ${
              currentModel === 'glm'
                ? 'bg-purple-500 text-white shadow-md'
                : availability.glm && !disabled && !isSwitching
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg">🔷</span>
              <span>GLM-4.6</span>
              {!availability.glm && (
                <span className="text-xs text-red-500">No key</span>
              )}
            </div>
          </button>
        </div>

        {isSwitching && (
          <div className="text-center">
            <span className="text-xs text-gray-500 dark:text-gray-400 animate-pulse">
              Switching models... Page will refresh
            </span>
          </div>
        )}

        <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <span>Status:</span>
            <span className={`font-medium ${
              availability[currentModel] ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {availability[currentModel] ? 'Active' : 'Missing API Key'}
            </span>
          </div>
        </div>

        {!availability.gemini && !availability.glm && (
          <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 p-2 rounded border border-orange-200 dark:border-orange-800">
            <strong>No AI models available:</strong> Add API keys to secrets.env to enable AI features.
          </div>
        )}
      </div>
    </div>
  );
};

export default AIModelSelector;