import React from 'react';

const FileUpload = ({ handleFileChange, error }) => {
  return (
    <div style={{ marginBottom: '20px' }}>
      <input type="file" accept=".docx" onChange={handleFileChange} />
      {error && (
        <div style={{ marginTop: '20px', color: 'red' }}>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
