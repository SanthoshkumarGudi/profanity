import React, { useState } from 'react';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';

function App() {
  // State variables to manage file input, errors, word counts, matched words, confirmation status, and the updated file
  const [file, setFile] = useState(null); // The uploaded .docx file
  const [error, setError] = useState(null); // Error messages
  const [wordCounts, setWordCounts] = useState({}); // Counts of each matched word
  const [matchedWords, setMatchedWords] = useState({}); // Matched words and their replacements
  const [confirmationNeeded, setConfirmationNeeded] = useState(false); // Flag to show confirmation before download
  const [updatedFile, setUpdatedFile] = useState(null); // The updated .docx file after replacements
  const [matchedKeys, setMatchedKeys] = useState([]); // Array of keys that were matched in the document
  const [replacementSelections, setReplacementSelections] = useState({}); // User-selected replacements for each key
  const [showReplacementSelector, setShowReplacementSelector] = useState(false); // Flag to show replacement selection UI
  const [tags, setTags] = useState([]);

  // Predefined words to search for and their replacement options
  const predefinedWords = {
    'Above': ['Surpassing', 'Beyond'],
    'Adapted For': ['Altered for', 'Modified for'],
    'Adapted To': ['Made adjustments to', 'Modified to'],
    'All': ['The total', 'Every single'],
    'Always': ['Perpetually', 'Invariably'],
    'Allow': ['Permit', 'Grant'],
    'Appropriately': ['Accordingly', 'Fittingly'],
    'Authoritative': ['Attested', 'Authenticated'],
    'Approximate': ['Closer', 'Almost'],
    'Around': ['On all sides', 'Throughout'],
    'Below': ['Less than', 'Lower than'],
    'Big': ['Oversize', 'Hefty'],
    'Best': ['Perfect', 'Ace', 'Incomparable'],
    'Biggest': ['Largest', 'Huge'],
    'Bigger': ['Greater', 'Heftier'],
    'Black Hat': ['Cybercriminal', 'Cracker'],
    'But': ['Although', 'In spite'],
    'By Necessity': ['Obligatory', 'Inescapable'],
    'Black List': ['Ban list', 'Prohibited list'],
    'Broadest': ['Spacious', 'Widespread'],
    'Certain': ['Undoubtful', 'Assertively'],
    'Certainly': ['Exactly', 'Assertively'],
    'Characterized By': ['Defined by', 'Recognised by'],
    'Chief': ['Head', 'First'],
    'Chinese Wall': ['Information Partition', 'Ethical barrier'],
    'Compel': ['Enforce', 'Urge'],
    'Clearly': ['Noticeably', 'Undoubtedly'],
    'Completely': ['To the limit', 'Fully'],
    'Compelled': ['Bound', 'Forced'],
    'Composed Of': ['Involving', 'Constructed from'],
    'Compelling': ['Forcing'],
    'Every': ['each'],
  };

  const claimSpecificTerms = [
    'at least one',
    'at least two',
    'one or more',
    'plurality of',
    'wherein'
  ]

  // Function to escape special regex characters in a string
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Handler for when a new file is selected
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
      const validExtensions = ['docx'];

      if (!validExtensions.includes(fileExtension)) {
        setError('Invalid file type. Please upload a .docx file.');
        setFile(null);
        return;
      }

      setFile(selectedFile); // Set the selected file
      setWordCounts({}); // Reset word counts
      setMatchedWords({}); // Reset matched words
      setConfirmationNeeded(false); // Reset confirmation flag
      setUpdatedFile(null); // Reset updated file
      setError(null); // Reset any existing errors
      setMatchedKeys([]); // Reset matched keys
      setReplacementSelections({}); // Reset replacement selections
      setShowReplacementSelector(false); // Hide replacement selector UI
    }
  };

  // Handler for the "Search and Replace" button click
  const handleSearchReplace = async () => {
    if (file) {
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const arrayBuffer = e.target.result; // Get the file content as an array buffer
          const uint8Array = new Uint8Array(arrayBuffer); // Convert to Uint8Array

          console.log('ArrayBuffer:', arrayBuffer);
          console.log('Uint8Array:', uint8Array);

          let zip;
          try {
            zip = new PizZip(uint8Array);
          } catch (zipError) {
            console.error('PizZip Error:', zipError);
            setError('Failed to parse the .docx file. Please ensure it is a valid and uncorrupted file.');
            return;
          }

          // Read 'word/document.xml' from the zip
          const documentXml = zip.file('word/document.xml');
          if (!documentXml) {
            setError('Invalid .docx file: Missing word/document.xml');
            return;
          }

          const xmlString = documentXml.asText();
          console.log(xmlString);

          // Parse the XML content
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

          // Get all elements in the document
          const allElements = document.getElementsByTagName("*");
          // Create a Set to store unique tag names
          const tagNames = new Set();
          for (const element of allElements) {
            tagNames.add(element.tagName.toLowerCase());
          }
          // Convert the Set to an array if needed
          const tagNamesArray = Array.from(tagNames);

          console.log("tag names are", tagNamesArray);

          console.log("xml string", xmlDoc);
          const wNamespace = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

          // Initialize variables to keep track of counts and matched words
          let counts = {};
          let matchedKeysArray = [];

          // Recursive function to traverse XML nodes
          const traverseNodes = (nodes) => {
            console.log("nodes length is", nodes.length);

            for (let i = 0; i < nodes.length; i++) {
              const node = nodes[i];

              // Check for paragraphs to process
              if (node.nodeName === 'w:p') {
                // Process the paragraph to find matches
                processParagraph(node);
                continue; // Continue to the next node
              }

              // Recursively traverse child nodes
              if (node.childNodes && node.childNodes.length > 0) {
                traverseNodes(node.childNodes);
              }
            }
          };

          // Function to process a paragraph and find matches
          const processParagraph = (paragraphNode) => {
            // Collect all runs and their text content
            let runs = [];
            let concatenatedText = '';
            let runPositions = []; // Array of objects with start and end indices

            const paragraphChildNodes = paragraphNode.childNodes;
            for (let j = 0; j < paragraphChildNodes.length; j++) {
              console.log("paragraphs nodes length", paragraphChildNodes.length);

              const child = paragraphChildNodes[j];
              if (child.nodeName === 'w:r') {
                let runText = '';
                let xmlSpacePreserve = false;

                for (let k = 0; k < child.childNodes.length; k++) {
                  const grandChild = child.childNodes[k];
                  if (grandChild.nodeName === 'w:t') {
                    // Check if xml:space="preserve" is set
                    if (grandChild.getAttribute('xml:space') === 'preserve') {
                      xmlSpacePreserve = true;
                    }
                    runText += grandChild.textContent;
                    console.log("run text is ", runText);
                    if (runText == 'DESCRIPTION') {
                      console.log("found de", 'grandchild node is', child);
                    }

                  }

                }

                // Include runs even if they contain only whitespace
                runs.push({
                  node: child,
                  text: runText,
                  xmlSpacePreserve: xmlSpacePreserve,
                });

                const startIndex = concatenatedText.length;
                console.log("start index is", startIndex);

                concatenatedText += runText;
                console.log("concatenated string is", concatenatedText);
                const endIndex = concatenatedText.length;
                console.log("end index is", endIndex);

                runPositions.push({
                  start: startIndex,
                  end: endIndex,
                  runIndex: runs.length - 1,
                });
              }
            }
            console.log(runs.length);


            if (runs.length === 0) return; // No runs to process

            // Perform searches to identify matched keys
            for (const key of Object.keys(predefinedWords)) {
              let regex;
              //it checks for key contains any non word characters
              if (/\W/.test(key)) {
                regex = new RegExp(escapeRegExp(key), 'gi');
              } else {
                regex = new RegExp(`\\b${escapeRegExp(key)}\\b`, 'gi');
              }

              let match;
              while ((match = regex.exec(concatenatedText)) !== null) {
                counts[key] = (counts[key] || 0) + 1;
                if (!matchedKeysArray.includes(key)) {
                  matchedKeysArray.push(key);
                }
              }


            }
          };

          // Start traversing from the document element
          traverseNodes(xmlDoc.documentElement.childNodes);
          if (matchedKeysArray.length === 0) {
            alert('No profanity words found in the document');
            return;
          }

          // Update state variables with the results
          setWordCounts(counts);
          setMatchedKeys(matchedKeysArray);
          setConfirmationNeeded(false); // Reset confirmation flag
          setUpdatedFile(null); // Reset updated file

          // Now, prompt the user to select replacements
          setReplacementSelections(
            matchedKeysArray.reduce((acc, key) => {
              acc[key] = predefinedWords[key][0]; // Default to the first option
              return acc;
            }, {})
          );

          setShowReplacementSelector(true); // Flag to show the replacement selection UI
        };

        reader.readAsArrayBuffer(file); // Read the file as an array buffer
      } catch (error) {
        console.error('Error performing replacements:', error);
        setError('Error performing replacements');
      }
    } else {
      alert('Please upload a .docx file');
    }
  };

  // Handler for when the user selects a replacement for a key
  const handleReplacementChange = (key, selectedReplacement) => {
    setReplacementSelections((prev) => ({
      ...prev,
      [key]: selectedReplacement,
    }));
  };

  // Handler to perform replacements based on user selections
  const handlePerformReplacement = async () => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target.result; // Get the file content as an array buffer
        const uint8Array = new Uint8Array(arrayBuffer); // Convert to Uint8Array

        console.log('ArrayBuffer for Replacement:', arrayBuffer);
        console.log('Uint8Array for Replacement:', uint8Array);

        let zip;
        try {
          zip = new PizZip(uint8Array);
        } catch (zipError) {
          console.error('PizZip Error during Replacement:', zipError);
          setError('Failed to parse the .docx file during replacement. Please ensure it is a valid and uncorrupted file.');
          return;
        }

        // Read 'word/document.xml' from the zip
        const documentXml = zip.file('word/document.xml');
        if (!documentXml) {
          setError('Invalid .docx file: Missing word/document.xml');
          return;
        }

        const xmlString = documentXml.asText();

        // Parse the XML content 
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
        const detailedDescription = xmlDoc.getElementsByTagName('detailed_descrption');

        if (detailedDescription) {
          console.log("ssssssssssssssssssssssssssssssss", detailedDescription.textContent)
        } else {
          console.log("tag not found");
        }

        const wNamespace = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

        // Recursive function to traverse XML nodes and perform replacements
        const traverseAndReplace = (nodes) => {
          for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];

            // Check for paragraphs to process
            if (node.nodeName === 'w:p') {
              processParagraph(node);
              continue; // Continue to the next node
            }

            // Recursively traverse child nodes
            if (node.childNodes && node.childNodes.length > 0) {
              traverseAndReplace(node.childNodes);
            }
          }
        };

        // Function to process a paragraph and perform replacements
        const processParagraph = (paragraphNode) => {
          // Collect all runs and their text content
          let runs = [];
          let concatenatedText = '';
          let runPositions = []; // Array of objects with start and end indices

          const paragraphChildNodes = paragraphNode.childNodes;
          for (let j = 0; j < paragraphChildNodes.length; j++) {
            const child = paragraphChildNodes[j];
            if (child.nodeName === 'w:r') {
              let runText = '';
              let xmlSpacePreserve = false;

              for (let k = 0; k < child.childNodes.length; k++) {
                const grandChild = child.childNodes[k];
                if (grandChild.nodeName === 'w:t') {
                  // Check if xml:space="preserve" is set
                  if (grandChild.getAttribute('xml:space') === 'preserve') {
                    xmlSpacePreserve = true;
                  }
                  runText += grandChild.textContent;
                }
              }

              // Include runs even if they contain only whitespace
              runs.push({
                node: child,
                text: runText,
                xmlSpacePreserve: xmlSpacePreserve,
              });
              const startIndex = concatenatedText.length;
              concatenatedText += runText;
              const endIndex = concatenatedText.length;
              runPositions.push({
                start: startIndex,
                end: endIndex,
                runIndex: runs.length - 1,
              });
            }
          }

          if (runs.length === 0) return; // No runs to process

          // Perform replacements on the concatenated text
          let replacements = []; // Array of objects {start, end, replacement, oldWord}

          for (const [oldWord, selectedReplacement] of Object.entries(replacementSelections)) {
            let regex;
            if (/\W/.test(oldWord)) {
              regex = new RegExp(escapeRegExp(oldWord), 'gi');
            } else {
              regex = new RegExp(`\\b${escapeRegExp(oldWord)}\\b`, 'gi');
            }

            let match;
            while ((match = regex.exec(concatenatedText)) !== null) {
              replacements.push({
                start: match.index,
                end: match.index + match[0].length,
                replacement: selectedReplacement,
                oldWord: oldWord,
              });
            }
          }

          if (replacements.length === 0) return; // No replacements needed

          // Sort replacements by start index
          replacements.sort((a, b) => a.start - b.start);

          // Build new runs with replacements
          let newRuns = [];
          let replacementIndex = 0; // Index in replacements array

          for (let rp = 0; rp < runPositions.length; rp++) {
            const runPos = runPositions[rp];
            const originalRun = runs[runPos.runIndex];
            const originalRunProperties = originalRun.node.getElementsByTagName('w:rPr')[0];

            let runStart = runPos.start;
            let runEnd = runPos.end;

            let runCurrentPos = runStart;

            while (runCurrentPos < runEnd) {
              if (
                replacementIndex < replacements.length &&
                replacements[replacementIndex].start < runEnd &&
                replacements[replacementIndex].end > runCurrentPos
              ) {
                const rep = replacements[replacementIndex];

                // Text before the replacement
                if (runCurrentPos < rep.start) {
                  const textBefore = concatenatedText.substring(runCurrentPos, rep.start);
                  const runNode = createRunNode(
                    xmlDoc,
                    wNamespace,
                    textBefore,
                    originalRunProperties,
                    originalRun.xmlSpacePreserve,
                    false
                  );
                  newRuns.push(runNode);
                }

                // Replacement text with highlighting
                const replacementText = rep.replacement;
                const runNode = createRunNode(
                  xmlDoc,
                  wNamespace,
                  replacementText,
                  originalRunProperties,
                  originalRun.xmlSpacePreserve,
                  true // Apply highlight
                );
                newRuns.push(runNode);

                runCurrentPos = rep.end;
                replacementIndex++;
              } else {
                // No replacement in this segment
                const text = concatenatedText.substring(runCurrentPos, runEnd);
                const runNode = createRunNode(
                  xmlDoc,
                  wNamespace,
                  text,
                  originalRunProperties,
                  originalRun.xmlSpacePreserve,
                  false
                );
                newRuns.push(runNode);
                runCurrentPos = runEnd;
              }
            }
          }




          // Remove all original runs
          for (let r = 0; r < runs.length; r++) {
            paragraphNode.removeChild(runs[r].node);
          }

          // Append new runs
          for (let nr = 0; nr < newRuns.length; nr++) {
            paragraphNode.appendChild(newRuns[nr]);
          }
        };

        // Helper function to create a run node
        const createRunNode = (
          xmlDoc,
          wNamespace,
          textContent,
          originalRunProperties,
          xmlSpacePreserve,
          highlight = false
        ) => {
          const runNode = xmlDoc.createElementNS(wNamespace, 'w:r');

          // Clone original run properties
          if (originalRunProperties) {
            const rPrNode = originalRunProperties.cloneNode(true);

            if (highlight) {
              // Add highlight
              let highlightExists = false;
              for (let child of rPrNode.childNodes) {
                if (child.nodeName === 'w:highlight') {
                  highlightExists = true;
                  break;
                }
              }
              if (!highlightExists) {
                const highlightNode = xmlDoc.createElementNS(wNamespace, 'w:highlight');
                highlightNode.setAttribute('w:val', 'yellow');
                rPrNode.appendChild(highlightNode);
              }
            }

            runNode.appendChild(rPrNode);
          } else if (highlight) {
            // Create run properties if they don't exist and add highlight
            const rPrNode = xmlDoc.createElementNS(wNamespace, 'w:rPr');
            const highlightNode = xmlDoc.createElementNS(wNamespace, 'w:highlight');
            highlightNode.setAttribute('w:val', 'yellow');
            rPrNode.appendChild(highlightNode);
            runNode.appendChild(rPrNode);
          }

          // Create text node
          const tNode = xmlDoc.createElementNS(wNamespace, 'w:t');

          // Set xml:space="preserve" if needed
          if (xmlSpacePreserve || /^\s|\s$/.test(textContent)) {
            tNode.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
          }

          tNode.textContent = textContent;
          runNode.appendChild(tNode);

          return runNode;
        };

        // Start traversing from the document element
        traverseAndReplace(xmlDoc.documentElement.childNodes);

        // Serialize the modified XML back to a string
        const serializer = new XMLSerializer();
        const modifiedXmlString = serializer.serializeToString(xmlDoc);

        // Replace 'word/document.xml' in the zip with the modified XML
        zip.file('word/document.xml', modifiedXmlString);

        // Generate the new file as a Blob
        const newFile = zip.generate({ type: 'blob' });

        // Update state variables with the results
        setUpdatedFile(newFile);
        setConfirmationNeeded(true); // Show confirmation before download
        setShowReplacementSelector(false); // Hide replacement selection UI
      };

      reader.readAsArrayBuffer(file); // Read the file as an array buffer
    } catch (error) {
      console.error('Error performing replacements:', error);
      setError('Error performing replacements');
    }
  };

  // Handler for the "Confirm and Download" button click
  const handleConfirmDownload = async () => {
    try {
      if (updatedFile) {
        // Download the updated file with replacements
        saveAs(updatedFile, 'edited-document.docx');
        setConfirmationNeeded(false); // Reset confirmation flag after download
      }
    } catch (error) {
      console.error('Error confirming download:', error);
      setError('Error confirming download');
    }
  };

  // Function to download matched words and their replacements as a .txt file
  const downloadMatchedWordsAsTxt = () => {
    // Define column widths for formatting
    const colWidth1 = 25; // Width for profanity words
    const colWidth2 = 40; // Width for alternative words
    const colWidth3 = 10; // Width for count

    // Create table header with borders
    const header = `Profanity Words${' '.repeat(colWidth1 - 'Profanity Words'.length)}| Alternative Words${' '.repeat(colWidth2 - 'Alternative Words'.length)}| Count`;
    const border = `${'-'.repeat(colWidth1)}+${'-'.repeat(colWidth2)}+${'-'.repeat(colWidth3)}`;

    // Initialize rows array to store each row of data
    let rows = [];

    // Loop through matched words and their counts
    for (const [word, altWord] of Object.entries(matchedWords)) {
      const count = wordCounts[word] || 0;
      const wordCol = word.padEnd(colWidth1, ' ');
      const altCol = altWord.padEnd(colWidth2, ' ');
      const countCol = count.toString().padEnd(colWidth3, ' ');
      rows.push(`${wordCol}| ${altCol}| ${countCol}`);
    }

    // Combine header, border, and rows into a single string
    const fileContent = [header, border, ...rows].join('\n');

    // Create a Blob and trigger the download
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'MatchedProfanityWords.txt');
  };

  // Styles for the table display
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
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Profanity Word Replacer</h1>

      {/* File input for uploading .docx files */}
      <div style={{ marginBottom: '20px' }}>
        <input type="file" accept=".docx" onChange={handleFileChange} />
      </div>

      {/* Buttons for processing and downloading */}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={handleSearchReplace} style={{ marginRight: '10px' }}>
          Search and Replace
        </button>
        <button onClick={downloadMatchedWordsAsTxt} disabled={Object.keys(wordCounts).length === 0}>
          Download Matched Profanity Words as .txt
        </button>
      </div>

      {/* Replacement Selection UI */}
      {showReplacementSelector && (
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
      )}

      {/* Display word counts if replacements were made and no confirmation is pending */}
      {Object.keys(wordCounts).length > 0 && !confirmationNeeded && !showReplacementSelector && (
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
        </div>
      )}

      {/* Confirmation prompt before downloading the updated file */}
      {confirmationNeeded && (
        <div>
          <h3>Confirm Replacement</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thTdStyle}>Profanity Word</th>
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
      )}

      {/* Display any error messages */}
      {error && (
        <div style={{ marginTop: '20px', color: 'red' }}>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

export default App;
