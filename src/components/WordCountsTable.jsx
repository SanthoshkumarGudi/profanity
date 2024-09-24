import React from 'react';

const WordCountsTable = ({ wordCounts, predefinedWords, claimTermCounts }) => {
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
      <h3>Word Counts:</h3>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thTdStyle}>Word</th>
            <th style={thTdStyle}>Replacement</th>
            <th style={thTdStyle}>Count</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(wordCounts).map(([word, count]) => (
            <tr key={word}>
              <td style={thTdStyle}>{word}</td>
              <td style={thTdStyle}>{predefinedWords[word].join(', ')}</td>
              <td style={thTdStyle}>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {Object.keys(claimTermCounts).length > 0 && (
        <>
          <h3>Claim-Specific Term Counts:</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thTdStyle}>Term</th>
                <th style={thTdStyle}>Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(claimTermCounts).map(([term, count]) => (
                <tr key={term}>
                  <td style={thTdStyle}>{term}</td>
                  <td style={thTdStyle}>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default WordCountsTable;
