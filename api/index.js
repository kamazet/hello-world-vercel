const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const pdfParse = require('pdf-parse'); // Equivalent to PyMuPDF (fitz) for text extraction
const XLSX = require('xlsx'); // Equivalent to pandas for Excel operations
const moment = require('moment'); // Equivalent to datetime for timestamping

// Initialize Express app
const app = express();
app.use(cors()); // Enable CORS for all routes
app.use(express.json());

// Serve static files from the root directory (e.g., for index.html)
// In Flask, this might be handled by `send_from_directory` or implicitly by the template engine
// For Vercel, static files are often served from the root or a 'public' directory.
// This line assumes your index.html, script.js, styles.css are in the parent directory of 'api'.
app.use(express.static(path.join(__dirname, '..')));

// Create uploads and results directories if they don't exist
const UPLOAD_FOLDER = path.join(__dirname, '..', 'uploads'); // Adjusted path for Vercel
const RESULTS_FOLDER = path.join(__dirname, '..', 'results'); // Adjusted path for Vercel

fs.ensureDirSync(UPLOAD_FOLDER);
fs.ensureDirSync(RESULTS_FOLDER);

// Configure multer for file uploads (handles multipart/form-data)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_FOLDER);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'), false);
    }
    cb(null, true);
  }
});

async function processPdf(filePath) {
  try {
    // Load the PDF
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text;

    console.log(text); // For debugging, as in app.py
    // Optionally, write to a debug file if needed for complex cases
    // fs.writeFileSync(path.join(RESULTS_FOLDER, 'pdf_debug_js.txt'), text);

    const transactionRegex = /(\d{2}\/\d{2})(.*?)(-?\d{1,3}(?:,\d{3})*(?:\.\d{2}))/g;
    const transactions = [];
    
    let match;
    while ((match = transactionRegex.exec(text)) !== null) {
      let [_, date, rawDescription, rawAmount] = match;
  
      // Clean up description
      let description = rawDescription.trim().replace(/\s+/g, ' ');
  
      // Special check: glued ID and Amount (digits directly followed by amount with comma)
      const gluedPattern = /(\d{9,})(\d{1,3},\d{3}\.\d{2})/;
      const gluedMatch = gluedPattern.exec(description);
      if (gluedMatch) {
        description = description.replace(gluedPattern, `$1`); // keep only PPD ID
        rawAmount = gluedMatch[2];
      }
  
      // Clean amount: remove commas and convert to float
      const amount = parseFloat(rawAmount.replace(/,/g, ''));
  
      transactions.push({
        date,
        description,
        amount
      });
    }

    if (transactions.length === 0) {
      return {
        success: false,
        message: 'No transactions found in the PDF using the primary pattern.',
        transactions: []
      };
    }

    // Create a formatted array with the required format
    const formattedTransactions = transactions.map(t => ({
      Date: t.date,
      Category: '', // Empty category column
      Subcategory: '', // Empty subcategory column
      Amount: t.amount * -1, // Invert the sign of amounts, as in app.py
      Description: t.description
    }));

    // Generate a unique filename for the Excel output
    const timestamp = moment().format('YYYYMMDD_HHmmss');
    const outputFile = path.join(RESULTS_FOLDER, `expense_tracker_${timestamp}.xlsx`);

    // Create Excel workbook and worksheet
    // Ensure columns are in the correct order: Date, Category, Subcategory, Amount, Description
    const worksheet = XLSX.utils.json_to_sheet(formattedTransactions, {
      header: ['Date', 'Category', 'Subcategory', 'Amount', 'Description']
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

    // Write to Excel file
    XLSX.writeFile(workbook, outputFile);

    // Prepare all transaction data for the response (already in correct format)
    const allData = formattedTransactions;

    // console.log(`\nExtracted ${allData.length} transactions:`);
    // console.log(allData.slice(0, 5)); // Log a sample, similar to Python's df print

    return {
      success: true,
      message: `Data exported to ${path.basename(outputFile)} with ${allData.length} transactions`,
      transaction_count: allData.length,
      transaction_data: allData,
      excel_file: path.basename(outputFile) // Send only basename, as in app.py
    };

  } catch (error) {
    console.error('Error processing PDF:', error);
    return {
      success: false,
      message: `Error processing PDF: ${error.message}`,
      transaction_data: [] // Changed from 'transactions' to 'transaction_data' for consistency
    };
  }
}

// Route to handle PDF upload
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    // Matches Flask: if 'file' not in request.files
    return res.status(400).json({ success: false, message: 'No file part in the request' });
  }
  // Multer's setup implies file.filename will exist if req.file exists
  // The check `file.filename == ''` is implicitly handled by `!req.file`

  // File type check is handled by multer's fileFilter. If error, multer calls cb(new Error(...))
  // which Express error handling should catch or multer itself might terminate the request.
  // For closer Flask parity, we might check req.file.originalname for allowed extensions if needed,
  // but mimetype check is generally more robust.

  const filePath = req.file.path;
  const result = await processPdf(filePath);

  if (result.success) {
    return res.status(200).json({
      success: true,
      message: result.message, // Use message from processPdf
      filename: req.file.originalname,
      transaction_count: result.transaction_count,
      transaction_data: result.transaction_data,
      excel_file: result.excel_file
    });
  } else {
    // In Flask, if no transactions, it still returns 200 with success:false
    return res.status(200).json({
      success: false,
      message: result.message,
      filename: req.file.originalname,
      transaction_data: result.transaction_data // Ensure this is an empty array on failure
    });
  }
});

// Route to update Excel file with latest transaction data
app.post('/api/update-excel', async (req, res) => {
  try {
    const data = req.body;
    // Flask checks for 'transactions' and 'filename' in request.json
    if (!data || !data.transactions || !data.filename) { // filename from original upload for context if needed
      return res.status(400).json({ success: false, message: 'Missing required data (transactions or filename)' });
    }

    const transactions = data.transactions;
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ success: false, message: 'No transaction data provided or data is not an array' });
    }

    // Ensure columns are in the correct order and exist, matching Flask's df structure
    const formattedTransactions = transactions.map(t => ({
      Date: t.Date || '',
      Category: t.Category || '',
      Subcategory: t.Subcategory || '',
      Amount: (t.Amount === undefined || t.Amount === null) ? '' : t.Amount, // Handle potential undefined/null amounts
      Description: t.Description || ''
    }));

    const timestamp = moment().format('YYYYMMDD_HHmmss');
    const newFilename = `updated_expense_tracker_${timestamp}.xlsx`;
    const outputFile = path.join(RESULTS_FOLDER, newFilename);

    const worksheet = XLSX.utils.json_to_sheet(formattedTransactions, {
      header: ['Date', 'Category', 'Subcategory', 'Amount', 'Description']
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
    XLSX.writeFile(workbook, outputFile);

    return res.status(200).json({
      success: true,
      message: 'Excel file updated successfully.', // Consistent message
      filename: newFilename // Send the new filename
    });

  } catch (error) {
    console.error('Error updating Excel file:', error);
    return res.status(500).json({ success: false, message: `Error updating Excel file: ${error.message}` });
  }
});

// Route to download the processed Excel file
app.get('/api/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(RESULTS_FOLDER, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }
    // `as_attachment: True` is default for res.download()
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        // It's important to check if headers were already sent
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Could not download the file.' });
        }
      }
    });
  } catch (error) {
    console.error('Error in download route:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Server error during file download.' });
    }
  }
});

// For Vercel serverless functions, we export the Express app
// For local development, this block allows running the server directly
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5001; // Default to 5001 if not set
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} for local development`);
  });
}

module.exports = app; // Export the app for Vercel
