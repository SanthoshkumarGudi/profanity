import React from 'react';

const Confirmation = ({ wordCounts, replacementSelections, handleConfirmDownload }) => {
  const tableStyle = {
    borderCollapse: 'collapse',
    width: '100%',
    marginTop: '20px',
  };

  const thTdStyle = {
    border: '1px solid black',
    padding: '8px',
    textAlign: 'left',
  };

  return (
    <div>
      <h3>Confirm Replacement</h3>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thTdStyle}>Predefined Word</th>
            <th style={thTdStyle}>Alternative Word</th>
            <th style={thTdStyle}>Count</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(wordCounts).map(([word, count]) => (
            <tr key={word}>
              <td style={thTdStyle}>{word}</td>
              <td style={thTdStyle}>{replacementSelections[word]}</td>
              <td style={thTdStyle}>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handleConfirmDownload} style={{ marginTop: '10px' }}>
        Confirm and Download
      </button>
    </div>
  );
};

export default Confirmation;
