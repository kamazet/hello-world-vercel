// Define categories and subcategories
const categoryData = {
    'Finance': ['Banking', 'Insurance', 'Investment', 'Job', 'Misc', 'Taxes'],
    'Food': ['Coffee', 'Groceries', 'Meal', 'Snack'],
    'Giving': ['Church', 'Donation', 'Gift'],
    'Living': ['Fitness', 'Lodging', 'Phone', 'Rent', 'Utilities'],
    'Medical': ['Medical'],
    'Misc': ['Misc'],
    'Recreation': ['Concerts', 'Drinks', 'Misc', 'Movies', 'Video Games'],
    'Supplies': ['Cabinet', 'Skincare', 'Clothes', 'Beauty', 'Furniture', 'Misc', 'Shoes', 'Tech', 'Appliances'],
    'Transportation': ['Bus', 'Flight', 'Gas', 'Misc', 'Parking', 'Public', 'Rental', 'Rideshare', 'Train']
};

// Helper functions for dropdown keyboard navigation

// Reset active selection in dropdown
function resetActiveSelection(dropdown) {
    const options = dropdown.querySelectorAll('.dropdown-option');
    options.forEach(option => {
        option.classList.remove('active');
    });
    
    // Set the first visible option as active
    const firstVisible = Array.from(options).find(option => option.style.display !== 'none');
    if (firstVisible) {
        firstVisible.classList.add('active');
    }
}

// Handle keyboard navigation in dropdowns
function handleDropdownKeyNavigation(event, dropdown, selectCallback) {
    // Only process if dropdown is visible
    if (dropdown.style.display === 'none') return;
    
    const options = Array.from(dropdown.querySelectorAll('.dropdown-option'))
        .filter(option => option.style.display !== 'none');
    
    if (options.length === 0) return;
    
    // Find current active option
    let activeIndex = options.findIndex(option => option.classList.contains('active'));
    if (activeIndex === -1) activeIndex = 0;
    
    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            // Move to next option
            options[activeIndex].classList.remove('active');
            activeIndex = (activeIndex + 1) % options.length;
            options[activeIndex].classList.add('active');
            // Ensure the active option is visible in the dropdown
            options[activeIndex].scrollIntoView({ block: 'nearest' });
            break;
            
        case 'ArrowUp':
            event.preventDefault();
            // Move to previous option
            options[activeIndex].classList.remove('active');
            activeIndex = (activeIndex - 1 + options.length) % options.length;
            options[activeIndex].classList.add('active');
            // Ensure the active option is visible in the dropdown
            options[activeIndex].scrollIntoView({ block: 'nearest' });
            break;
            
        case 'Enter':
            event.preventDefault();
            // Select the active option
            if (options[activeIndex]) {
                selectCallback(options[activeIndex]);
            }
            break;
            
        case 'Escape':
            event.preventDefault();
            // Close the dropdown
            dropdown.style.display = 'none';
            break;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const uploadButton = document.getElementById('uploadButton');
    const uploadStatus = document.getElementById('uploadStatus');
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'results-container';
    document.querySelector('.container').appendChild(resultsContainer);
    
    let selectedFile = null;
    
    // Handle click on the drop area
    dropArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Handle file selection via input
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
    
    // Handle drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('dragover');
    }
    
    function unhighlight() {
        dropArea.classList.remove('dragover');
    }
    
    // Handle dropped files
    dropArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    });
    
    // Process the selected files
    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            
            // Check if file is a PDF
            if (file.type === 'application/pdf') {
                selectedFile = file;
                fileInfo.innerHTML = `
                    <p><strong>File:</strong> ${file.name}</p>
                    <p><strong>Size:</strong> ${formatFileSize(file.size)}</p>
                `;
                uploadButton.disabled = false;
            } else {
                fileInfo.innerHTML = '<p class="error">Please select a PDF file</p>';
                uploadButton.disabled = true;
                selectedFile = null;
            }
        }
    }
    
    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Handle upload button click
    uploadButton.addEventListener('click', uploadFile);
    
    // Create a table from transaction data
    function createTransactionTable(transactions) {
        // Ensure transactions is an array
        if (!Array.isArray(transactions)) {
            console.error('Expected transactions to be an array, got:', typeof transactions);
            transactions = [];
        }
        
        const table = document.createElement('table');
        table.className = 'transaction-table';
        
        // Create header row
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const headers = ['', 'Date', 'Category', 'Subcategory', 'Amount', 'Description'];
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create table body with transaction data
        const tbody = document.createElement('tbody');
        
        // Add a message if no transactions
        if (transactions.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 6; // Updated to match the number of columns
            cell.textContent = 'No transaction data found';
            cell.style.textAlign = 'center';
            cell.style.padding = '20px';
            row.appendChild(cell);
            tbody.appendChild(row);
        } else {
            // Add all transactions
            transactions.forEach((transaction, index) => {
                if (!transaction) {
                    console.error('Invalid transaction:', transaction);
                    return; // Skip this iteration
                }
                
                const row = document.createElement('tr');
                row.dataset.index = index; // Store the index for reference
                
                // Add delete button cell first
                const deleteCell = document.createElement('td');
                deleteCell.className = 'delete-cell';
                const deleteButton = document.createElement('button');
                deleteButton.className = 'delete-button';
                deleteButton.innerHTML = '&times;'; // × symbol
                deleteButton.title = 'Delete transaction';
                deleteButton.dataset.index = index;
                
                // Handle delete button click
                deleteButton.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (confirm('Are you sure you want to delete this transaction?')) {
                        // Remove the transaction from the array
                        transactions.splice(index, 1);
                        
                        // Remove the row from the table
                        row.remove();
                        
                        // Update the transaction count
                        const countElement = document.querySelector('.results-header p');
                        if (countElement) {
                            const currentCount = transactions.length;
                            countElement.textContent = `${currentCount} transactions extracted`;
                        }
                        
                        // If no transactions left, show a message
                        if (transactions.length === 0) {
                            const tbody = table.querySelector('tbody');
                            if (tbody) {
                                tbody.innerHTML = '';
                                const emptyRow = document.createElement('tr');
                                const emptyCell = document.createElement('td');
                                emptyCell.colSpan = 6; // Updated column count
                                emptyCell.textContent = 'No transaction data found';
                                emptyCell.style.textAlign = 'center';
                                emptyCell.style.padding = '20px';
                                emptyRow.appendChild(emptyCell);
                                tbody.appendChild(emptyRow);
                            }
                        }
                    }
                };
                
                deleteCell.appendChild(deleteButton);
                row.appendChild(deleteCell);
                
                // Add cells for each property with defensive checks
                const dateCell = document.createElement('td');
                dateCell.textContent = transaction.Date || 'N/A';
                row.appendChild(dateCell);
                
                // Create Category dropdown
                const categoryCell = document.createElement('td');
                const categoryContainer = document.createElement('div');
                categoryContainer.className = 'dropdown-container';
                
                const categoryInput = document.createElement('input');
                categoryInput.type = 'text';
                categoryInput.className = 'category-input';
                categoryInput.value = transaction.Category || '';
                categoryInput.placeholder = 'Select category';
                categoryInput.dataset.index = index;
                categoryInput.dataset.type = 'category';
                
                const categoryDropdown = document.createElement('div');
                categoryDropdown.className = 'dropdown';
                categoryDropdown.style.display = 'none';
                
                // Add category options
                Object.keys(categoryData).forEach(category => {
                    const option = document.createElement('div');
                    option.className = 'dropdown-option';
                    option.textContent = category;
                    option.onclick = function() {
                        categoryInput.value = category;
                        categoryDropdown.style.display = 'none';
                        
                        // Update the subcategory dropdown options
                        updateSubcategoryOptions(index, category);
                        
                        // Update the transaction data
                        transaction.Category = category;
                    };
                    categoryDropdown.appendChild(option);
                });
                
                // Show/hide dropdown on focus/blur
                categoryInput.onfocus = function() {
                    categoryDropdown.style.display = 'block';
                    // Reset active selection
                    resetActiveSelection(categoryDropdown);
                };
                
                categoryInput.onblur = function() {
                    // Delay hiding to allow for option selection
                    setTimeout(() => {
                        categoryDropdown.style.display = 'none';
                    }, 200);
                };
                
                // Filter options on input
                categoryInput.oninput = function() {
                    const value = this.value.toLowerCase();
                    const options = categoryDropdown.querySelectorAll('.dropdown-option');
                    
                    options.forEach(option => {
                        if (option.textContent.toLowerCase().includes(value)) {
                            option.style.display = 'block';
                        } else {
                            option.style.display = 'none';
                        }
                    });
                    
                    // Reset active selection after filtering
                    resetActiveSelection(categoryDropdown);
                };
                
                // Handle keyboard navigation
                categoryInput.onkeydown = function(e) {
                    handleDropdownKeyNavigation(e, categoryDropdown, (selectedOption) => {
                        // Update input value and trigger category change
                        categoryInput.value = selectedOption.textContent;
                        categoryDropdown.style.display = 'none';
                        
                        // Update the subcategory dropdown options
                        updateSubcategoryOptions(index, selectedOption.textContent);
                        
                        // Update the transaction data
                        transaction.Category = selectedOption.textContent;
                    });
                };
                
                categoryContainer.appendChild(categoryInput);
                categoryContainer.appendChild(categoryDropdown);
                categoryCell.appendChild(categoryContainer);
                row.appendChild(categoryCell);
                
                // Create Subcategory dropdown
                const subcategoryCell = document.createElement('td');
                const subcategoryContainer = document.createElement('div');
                subcategoryContainer.className = 'dropdown-container';
                
                const subcategoryInput = document.createElement('input');
                subcategoryInput.type = 'text';
                subcategoryInput.className = 'subcategory-input';
                subcategoryInput.value = transaction.Subcategory || '';
                subcategoryInput.placeholder = 'Select subcategory';
                subcategoryInput.dataset.index = index;
                subcategoryInput.dataset.type = 'subcategory';
                
                const subcategoryDropdown = document.createElement('div');
                subcategoryDropdown.className = 'dropdown';
                subcategoryDropdown.id = `subcategory-dropdown-${index}`;
                subcategoryDropdown.style.display = 'none';
                
                // Function to populate subcategory options
                function populateSubcategoryOptions(category) {
                    // Clear existing options
                    subcategoryDropdown.innerHTML = '';
                    
                    if (category && categoryData[category]) {
                        // If category is selected, show only relevant subcategories
                        categoryData[category].forEach(subcategory => {
                            addSubcategoryOption(subcategory);
                        });
                    } else {
                        // If no category is selected, show all subcategories
                        Object.keys(categoryData).forEach(cat => {
                            categoryData[cat].forEach(subcategory => {
                                // Add category prefix to subcategory for clarity
                                addSubcategoryOption(subcategory, cat);
                            });
                        });
                    }
                }
                
                // Helper function to add subcategory option
                function addSubcategoryOption(subcategory, categoryPrefix) {
                    const option = document.createElement('div');
                    option.className = 'dropdown-option';
                    
                    // If category prefix is provided, display it for clarity
                    if (categoryPrefix) {
                        option.innerHTML = `<span class="subcategory-text">${subcategory}</span> <span class="category-prefix">(${categoryPrefix})</span>`;
                        // Store the raw subcategory value without the category prefix
                        option.dataset.value = subcategory;
                    } else {
                        option.textContent = subcategory;
                        option.dataset.value = subcategory;
                    }
                    
                    option.onclick = function() {
                        subcategoryInput.value = option.dataset.value;
                        subcategoryDropdown.style.display = 'none';
                        
                        // If no category is set and we're selecting from all subcategories,
                        // also set the category automatically
                        if (categoryPrefix && !transaction.Category) {
                            transaction.Category = categoryPrefix;
                            const categoryInput = document.querySelector(`.category-input[data-index="${index}"]`);
                            if (categoryInput) {
                                categoryInput.value = categoryPrefix;
                            }
                        }
                        
                        // Update the transaction data
                        transaction.Subcategory = option.dataset.value;
                    };
                    
                    subcategoryDropdown.appendChild(option);
                }
                
                // Initialize subcategory options
                populateSubcategoryOptions(transaction.Category);
                
                // Show/hide dropdown on focus/blur
                subcategoryInput.onfocus = function() {
                    subcategoryDropdown.style.display = 'block';
                    // Reset active selection
                    resetActiveSelection(subcategoryDropdown);
                };
                
                subcategoryInput.onblur = function() {
                    // Delay hiding to allow for option selection
                    setTimeout(() => {
                        subcategoryDropdown.style.display = 'none';
                    }, 200);
                };
                
                // Filter options on input
                subcategoryInput.oninput = function() {
                    const value = this.value.toLowerCase();
                    const options = subcategoryDropdown.querySelectorAll('.dropdown-option');
                    
                    options.forEach(option => {
                        if (option.textContent.toLowerCase().includes(value)) {
                            option.style.display = 'block';
                        } else {
                            option.style.display = 'none';
                        }
                    });
                    
                    // Reset active selection after filtering
                    resetActiveSelection(subcategoryDropdown);
                };
                
                // Handle keyboard navigation
                subcategoryInput.onkeydown = function(e) {
                    handleDropdownKeyNavigation(e, subcategoryDropdown, (selectedOption) => {
                        // Get the subcategory value from the dataset
                        const subcategoryValue = selectedOption.dataset.value || selectedOption.textContent;
                        
                        // Update input value
                        subcategoryInput.value = subcategoryValue;
                        subcategoryDropdown.style.display = 'none';
                        
                        // If no category is set and we're selecting from all subcategories,
                        // also set the category automatically
                        if (selectedOption.querySelector('.category-prefix') && !transaction.Category) {
                            // Extract category from the prefix text (format: "(Category)")
                            const categoryText = selectedOption.querySelector('.category-prefix').textContent;
                            const categoryPrefix = categoryText.replace(/[()]/g, ''); // Remove parentheses
                            
                            transaction.Category = categoryPrefix;
                            const categoryInput = document.querySelector(`.category-input[data-index="${index}"]`);
                            if (categoryInput) {
                                categoryInput.value = categoryPrefix;
                            }
                        }
                        
                        // Update the transaction data
                        transaction.Subcategory = subcategoryValue;
                    });
                };
                
                subcategoryContainer.appendChild(subcategoryInput);
                subcategoryContainer.appendChild(subcategoryDropdown);
                subcategoryCell.appendChild(subcategoryContainer);
                row.appendChild(subcategoryCell);
                
                const amountCell = document.createElement('td');
                if (transaction.Amount !== undefined && !isNaN(transaction.Amount)) {
                    amountCell.textContent = `$${Math.abs(transaction.Amount).toFixed(2)}`;
                    amountCell.className = transaction.Amount < 0 ? 'negative' : 'positive';
                } else {
                    amountCell.textContent = 'N/A';
                }
                row.appendChild(amountCell);
                
                // Create editable description cell with textarea
                const descCell = document.createElement('td');
                const descInput = document.createElement('textarea');
                descInput.className = 'description-input';
                descInput.value = transaction.Description || '';
                descInput.placeholder = 'Enter description';
                descInput.dataset.index = index;
                descInput.rows = 1; // Start with 1 row
                descInput.style.resize = 'none'; // Disable manual resizing
                
                // Auto-resize textarea based on content
                const autoResizeTextarea = (element) => {
                    element.style.height = 'auto';
                    const newHeight = Math.min(element.scrollHeight, 56); // Limit to ~2 lines (28px per line)
                    element.style.height = newHeight + 'px';
                };
                
                // Initialize height
                setTimeout(() => autoResizeTextarea(descInput), 0);
                
                // Update height on input
                descInput.oninput = function() {
                    autoResizeTextarea(this);
                };
                
                // Update transaction data when description changes
                descInput.onchange = function() {
                    transaction.Description = this.value;
                };
                
                // Add textarea to cell
                descCell.appendChild(descInput);
                row.appendChild(descCell);
                
                tbody.appendChild(row);
            });
        }
        
        // Function to update subcategory options based on selected category
        function updateSubcategoryOptions(index, category) {
            const subcategoryDropdown = document.getElementById(`subcategory-dropdown-${index}`);
            if (!subcategoryDropdown) return;
            
            // Clear existing options
            subcategoryDropdown.innerHTML = '';
            
            if (category && categoryData[category]) {
                // If category is selected, show only relevant subcategories
                categoryData[category].forEach(subcategory => {
                    addOptionToDropdown(subcategory);
                });
            } else {
                // If no category is selected, show all subcategories
                Object.keys(categoryData).forEach(cat => {
                    categoryData[cat].forEach(subcategory => {
                        // Add category prefix to subcategory for clarity
                        addOptionToDropdown(subcategory, cat);
                    });
                });
            }
            
            // Helper function to add option to dropdown
            function addOptionToDropdown(subcategory, categoryPrefix) {
                const option = document.createElement('div');
                option.className = 'dropdown-option';
                
                // If category prefix is provided, display it for clarity
                if (categoryPrefix) {
                    option.innerHTML = `<span class="subcategory-text">${subcategory}</span> <span class="category-prefix">(${categoryPrefix})</span>`;
                    // Store the raw subcategory value without the category prefix
                    option.dataset.value = subcategory;
                } else {
                    option.textContent = subcategory;
                    option.dataset.value = subcategory;
                }
                
                option.onclick = function() {
                    const input = document.querySelector(`.subcategory-input[data-index="${index}"]`);
                    if (input) {
                        input.value = option.dataset.value;
                        subcategoryDropdown.style.display = 'none';
                        
                        // If no category is set and we're selecting from all subcategories,
                        // also set the category automatically
                        if (categoryPrefix && !transactions[index].Category) {
                            transactions[index].Category = categoryPrefix;
                            const categoryInput = document.querySelector(`.category-input[data-index="${index}"]`);
                            if (categoryInput) {
                                categoryInput.value = categoryPrefix;
                            }
                        }
                        
                        // Update the transaction data
                        transactions[index].Subcategory = option.dataset.value;
                    }
                };
                
                subcategoryDropdown.appendChild(option);
            }
        }
        
        table.appendChild(tbody);
        return table;
    }
    
    // Upload the file
    function uploadFile() {
        if (!selectedFile) {
            return;
        }
        
        // Create FormData
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        // Update UI
        uploadButton.disabled = true;
        uploadButton.textContent = 'Processing...';
        uploadStatus.innerHTML = '';
        uploadStatus.className = 'upload-status';
        resultsContainer.innerHTML = '';
        
        // Send the file to the server
        fetch('/api/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log('API Response:', data);
            
            if (data.success) {
                // Display success message
                uploadStatus.innerHTML = `<p>PDF processed successfully!</p>`;
                uploadStatus.classList.add('success');
                uploadButton.textContent = 'Upload PDF';
                
                // Display transaction results
                if (data.transaction_count > 0) {
                    const resultsHeader = document.createElement('div');
                    resultsHeader.className = 'results-header';
                    resultsHeader.innerHTML = `
                        <h2>Transaction Results</h2>
                        <p>${data.transaction_count} transactions extracted</p>
                    `;
                    
                    // Create download button
                    const downloadButton = document.createElement('button');
                    downloadButton.className = 'download-button';
                    downloadButton.textContent = 'Download Excel File';
                    downloadButton.dataset.filename = data.excel_file;
                    
                    // Handle download button click
                    downloadButton.addEventListener('click', function() {
                        // Show loading state
                        const originalText = this.textContent;
                        this.textContent = 'Generating Excel...';
                        this.disabled = true;
                        
                        // Send updated transaction data to server
                        fetch('/api/update-excel', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                filename: this.dataset.filename,
                                transactions: transactions
                            })
                        })
                        .then(response => response.json())
                        .then(result => {
                            if (result.success) {
                                // Create temporary link and trigger download
                                const downloadLink = document.createElement('a');
                                downloadLink.href = `/api/download/${result.filename}`;
                                downloadLink.setAttribute('download', '');
                                document.body.appendChild(downloadLink);
                                downloadLink.click();
                                document.body.removeChild(downloadLink);
                                
                                // Show success message
                                const statusElement = document.createElement('div');
                                statusElement.className = 'download-status success';
                                statusElement.textContent = 'Excel file updated with your changes!';
                                this.parentNode.insertBefore(statusElement, this.nextSibling);
                                
                                // Remove status message after a few seconds
                                setTimeout(() => {
                                    if (statusElement.parentNode) {
                                        statusElement.parentNode.removeChild(statusElement);
                                    }
                                }, 3000);
                            } else {
                                alert('Error updating Excel file: ' + (result.message || 'Unknown error'));
                            }
                            
                            // Reset button
                            this.textContent = originalText;
                            this.disabled = false;
                        })
                        .catch(error => {
                            console.error('Error updating Excel file:', error);
                            alert('Error updating Excel file. Please try again.');
                            
                            // Reset button
                            this.textContent = originalText;
                            this.disabled = false;
                        });
                    });
                    
                    // Create transaction data section
                    const dataSection = document.createElement('div');
                    dataSection.className = 'data-section';
                    dataSection.innerHTML = '<h3>All Extracted Transactions:</h3>';
                    
                    // Check if transaction_data exists and is valid
                    // We'll use a single transactions array for both display and data sending
                    let transactions = [];
                    
                    if (data.transaction_data && Array.isArray(data.transaction_data)) {
                        console.log('Transaction data is an array with length:', data.transaction_data.length);
                        transactions = data.transaction_data;
                    } else {
                        console.error('Transaction data is not an array or is missing:', data.transaction_data);
                    }
                    
                    // Create and add transaction table with all data
                    const table = createTransactionTable(transactions);
                    
                    // Add all elements to results container
                    resultsContainer.appendChild(resultsHeader);
                    resultsContainer.appendChild(downloadButton);
                    resultsContainer.appendChild(dataSection);
                    resultsContainer.appendChild(table);
                    
                    // Scroll to results
                    resultsContainer.scrollIntoView({ behavior: 'smooth' });
                } else {
                    resultsContainer.innerHTML = '<div class="no-results">No transactions were found in the PDF.</div>';
                }
                
                // Reset the file input
                fileInput.value = '';
                fileInfo.innerHTML = '<p>No file selected</p>';
                uploadButton.disabled = true;
                selectedFile = null;
            } else {
                throw new Error(data.message || data.error || 'Processing failed');
            }
        })
        .catch(error => {
            uploadStatus.innerHTML = `<p>Error: ${error.message}</p>`;
            uploadStatus.classList.add('error');
            uploadButton.textContent = 'Upload PDF';
            uploadButton.disabled = false;
        });
    }
});
