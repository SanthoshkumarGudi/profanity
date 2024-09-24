import React from 'react';

const WordReplacementSelector = ({ matchedKeys, replacementSelections, predefinedWords, handleReplacementChange, handlePerformReplacement }) => {
  return (
    <div>
      <h3>Select Replacements for Matched Words:</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handlePerformReplacement();
        }}
      >
        {matchedKeys.map((key) => (
          <div key={key} style={{ marginBottom: '10px' }}>
            <label style={{ marginRight: '10px' }}>{key}:</label>
            <select
              value={replacementSelections[key]}
              onChange={(e) => handleReplacementChange(key, e.target.value)}
            >
              {predefinedWords[key].map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        ))}
        <button type="submit" style={{ marginTop: '10px' }}>
          Perform Replacements
        </button>
      </form>
    </div>
  );
};

export default WordReplacementSelector;
