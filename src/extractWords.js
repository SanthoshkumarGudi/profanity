const mammoth = require('mammoth');
const fs = require('fs');

// Function to extract and print words from a .docx file
async function extractWordsFromDocx(filePath) {
    try {
        console.log(`Reading file from: ${filePath}`);

        // Read the .docx file into a buffer
        const buffer = fs.readFileSync(filePath);
        console.log('File read successfully');

        // Convert the buffer to text using mammoth
        const result = await mammoth.extractRawText({ buffer });
        console.log('Text extracted successfully');

        // Split the extracted text into lines
        const lines = result.value.split('\n');

        // Print each word from each line
        lines.forEach((line, lineIndex) => {
            const words = line.split(/\s+/); // Split line into words
            words.forEach((word, wordIndex) => {
                if (word) { // Check if the word is not empty
                    console.log(`Line ${lineIndex + 1}, Word ${wordIndex + 1}: ${word}`);
                }
            });
        });
    } catch (error) {
        console.error('Error extracting words:', error);
    }
}

// Path to your .docx file
const filePath = "C:\\Users\\dverm\\OneDrive\\Desktop\\US9032112.docx";

// Extract words and print them
extractWordsFromDocx(filePath);
