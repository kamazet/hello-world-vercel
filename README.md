# Expense Tracker Application

A web application that allows users to upload PDF bank statements, extract transactions, categorize them, and export to Excel.

## Features

- PDF bank statement processing
- Transaction extraction using regular expressions
- Interactive UI for categorizing transactions
- Excel export functionality
- Drag and drop file upload

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js with Express
- **PDF Processing**: pdf-parse
- **Excel Generation**: xlsx
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Development

To run the application locally:

```bash
npm run dev
```

This will start the development server at http://localhost:5000.

### Deployment

This application is configured for deployment on Vercel. Simply push to your connected Git repository, and Vercel will automatically deploy your changes.

## How to Use

1. Upload a PDF bank statement by clicking on the upload area or dragging and dropping a file
2. Wait for the application to process the PDF and extract transactions
3. Categorize each transaction by selecting a category and subcategory
4. Click "Save Categories" to save your changes
5. Click "Download Excel" to download the categorized transactions as an Excel file

## Project Structure

```
├── api/                # Backend API code
│   └── index.js        # Main Express server file
├── uploads/            # Temporary storage for uploaded PDFs
├── results/            # Storage for generated Excel files
├── index.html          # Frontend UI
├── package.json        # Project dependencies
└── vercel.json         # Vercel deployment configuration
```

## License

ISC 

## Local Development

To run this project locally:

```bash
# Using a simple HTTP server
npx serve

# Or with Python
python -m http.server
```
