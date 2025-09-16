//=========================
//START
//=========================

let rowCount = 0;
let tableData = [];
let entriesPerPage = 6;
let currentPage = 1;
const translatableColumns = ['toWhom', 'place', 'subject', 'sentBy'];
let translationCache = new Map();

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

//========================================
//MOBILE TOOLBAR
//========================================
function toggleMobileMenu() {
    const toolbar = document.getElementById('toolbar');
    toolbar.classList.toggle('active');
}

function toggleDropdown() {
    const container = document.querySelector('.split-btn-container');
    container.classList.toggle('active');
}

// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
    const toolbar = document.getElementById('toolbar');
    const toggle = document.querySelector('.mobile-menu-toggle');
    
    // Check if elements exist before accessing their methods
    if (toolbar && toggle && !toolbar.contains(event.target) && !toggle.contains(event.target)) {
        toolbar.classList.remove('active');
    }
});

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const container = document.querySelector('.split-btn-container');
    
    // Check if element exists before accessing its methods
    if (container && !container.contains(event.target)) {
        container.classList.remove('active');
    }
});

// Function to switch to the other page with flip effect
function switchPage(targetPage) {
    localStorage.setItem('flipTo', targetPage);
    const flipContainer = document.getElementById('flipContainer');
    flipContainer.classList.add('flip-out');
    setTimeout(() => {
        window.location.href = targetPage === 'despatch' ? 'dak_despatch.html' : 'dak_acquired.html';
    }, 600); // Match animation duration
}

// On page load, check if flip-in animation should be applied
window.addEventListener('load', () => {
    const flipTo = localStorage.getItem('flipTo');
    const currentPage = window.location.pathname.includes('dak_despatch.html') ? 'despatch' : 'acquired';
    if (flipTo === currentPage) {
        const flipContainer = document.getElementById('flipContainer');
        flipContainer.classList.add('flip-in');
        localStorage.removeItem('flipTo');
    }
});

//==========================================
//DATE FUNCTIONALITY
//==========================================

function restrictDateInput(input) {
    // Remove any non-numeric characters except slashes
    input.value = input.value.replace(/[^0-9/]/g, '');

    // Ensure the format is dd/mm/yyyy
    let value = input.value;
    
    // Auto-add slashes after day and month
    if (value.length === 2 && !value.includes('/')) {
        input.value = value + '/';
    } else if (value.length === 5 && value.split('/').length === 2) {
        input.value = value + '/';
    }

    // Limit input length to 10 (dd/mm/yyyy)
    if (value.length > 10) {
        input.value = value.slice(0, 10);
    }

    // Validate date format (dd/mm/yyyy)
    if (value.length === 10) {
        const parts = value.split('/');
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);

        // Check for valid days in month (basic, without leap year for Feb)
        let isValid = true;
        if (month < 1 || month > 12) isValid = false;
        if (day < 1 || day > 31) isValid = false;
        if ([4,6,9,11].includes(month) && day > 30) isValid = false;
        if (month === 2 && day > 29) isValid = false;
        if (year < 1000 || year > 9999) isValid = false;

        if (!isValid) {
            input.setCustomValidity('Please enter a valid date in dd/mm/yyyy format');
            input.reportValidity();
        } else {
            input.setCustomValidity('');
        }
    } else {
        input.setCustomValidity('');
    }
}

function parseDate(dateStr) {
    if (!dateStr) return new Date('1900-01-01');
    const parts = dateStr.split('/');
    if (parts.length !== 3) return new Date('1900-01-01');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
}

//==========================================
//INITIALIZE TABLE
//==========================================
function initializeTable() {
    for (let i = 0; i < 6; i++) {
        addNewRow();
    }
    rebuildTable();
    setupRowInsertion();
    
    // Add event listeners with null checks
    const addRowBtn = document.querySelector('.add-row-btn');
    if (addRowBtn) addRowBtn.addEventListener('click', addNewRow);
 
    // NEW: Add save and load button listeners
    const saveBtn = document.querySelector('.save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveToDatabase);
        console.log('✅ Save button listener attached');
    } else {
        console.error('❌ Save button not found!');
    }

    // Add sorting listeners
    document.querySelectorAll('.hamburger-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const column = this.parentElement.parentElement.parentElement.className;
            toggleSortMenu(column);
        });
    });
    
    //=================
    //LOAD DATA
    //=================
    /*const loadBtn = document.getElementById('loadBtn');

    if (loadBtn) {
        loadBtn.addEventListener('click', loadUserData);
        console.log('✅ Load button listener attached');
    } 
    else {
        console.error('❌ Load button not found!');
    }*/
    
    //============================
    //SORTING LISTENERS
    //============================

    document.querySelectorAll('.hamburger-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const column = this.parentElement.parentElement.parentElement.className;
            toggleSortMenu(column);
        });
    });
}
//=========================
//FONT STYLE AND SIZE
//=========================

let activeCell = null;

document.getElementById('tableBody').addEventListener('click', (event) => {
    const cell = event.target.closest('.cell');
    if (cell && cell.isContentEditable) {
        activeCell = cell;
        cell.focus();
    }
});

function changeFontStyle(selectElement) {
    const selectedFont = selectElement.value;
    const table = document.getElementById("excelTable");
    if (table) {
        table.style.fontFamily = selectedFont;
    }
}

function changeFontSize(selectElement) {
  const size = selectElement.value;
  const table = document.getElementById("excelTable");
  const tdata = document.getElementById("tableBody");
  table.style.fontSize = size;
  tdata.style.fontSize = size;

  // Optional: apply to each <td> and <th>
  const cells = table.querySelectorAll("td, th");
  cells.forEach(cell => cell.style.fontSize = size);
}

let currentEditingCell = null;
let redoStack = [];

// Initialize the formatting system
function initializeTextFormatting() {
    console.log('Initializing text formatting...');
    
    
    makeTableCellsEditable();
    
    setupFormattingButtons();
    
    setupKeyboardShortcuts();

}

// MAKE TABLE CELLS EDITABLE
function makeTableCellsEditable() {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) {
        console.error('Table body not found');
        return;
    }

    // MAKE EXISTING TABLES EDITABLE 
    const cells = tableBody.querySelectorAll('td');
    cells.forEach(cell => {
        setupCellEditing(cell);
    });

    //HANDLE DYNAMICALLY ADDED ROWS
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1 && node.tagName === 'TR') {
                    const cells = node.querySelectorAll('td');
                    cells.forEach(cell => {
                        setupCellEditing(cell);
                    });
                }
            });
        });
    });

    observer.observe(tableBody, { childList: true, subtree: true });
}

//===========================
//NO OF ENTRIES
//===========================

document.addEventListener('DOMContentLoaded', () => {
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const splitBtnContainer = document.querySelector('.split-btn-container');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    const entriesBtn = document.querySelector('.entries-btn');
    const dropdownItems = document.querySelectorAll('.dropdown-menu li a');

    // Toggle dropdown on clicking the toggle button
    dropdownToggle.addEventListener('click', () => {
        splitBtnContainer.classList.toggle('active');
        dropdownToggle.setAttribute(
            'aria-expanded',
            splitBtnContainer.classList.contains('active')
        );
    });
    entriesBtn.addEventListener('click', () => {
        splitBtnContainer.classList.toggle('active');
        dropdownToggle.setAttribute(
            'aria-expanded',
            splitBtnContainer.classList.contains('active')
        );
    });

    document.addEventListener('click', (e) => {
        if (!splitBtnContainer.contains(e.target)) {
            splitBtnContainer.classList.remove('active');
            dropdownToggle.setAttribute('aria-expanded', 'false');
        }
    });

    dropdownItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault(); 
            const selectedValue = parseInt(item.textContent); 
            entriesBtn.textContent = selectedValue; 
            entriesPerPage = selectedValue;
            currentPage = 1;
            rebuildTable();
            splitBtnContainer.classList.remove('active');
            dropdownToggle.setAttribute('aria-expanded', 'false');
            console.log(`Selected number of entries: ${selectedValue} entries`);
        });
    });
});
document.addEventListener('DOMContentLoaded', initializeTable);



/*
const boldBtn = document.getElementById('bold');
const italicBtn = document.getElementById('italics');
const underlineBtn = document.getElementById('underline');
const tbody = document.getElementById('r1');


boldBtn.addEventListener('click', () => {
    document.execCommand('bold', false, null);
    tbody.focus();
});

italicBtn.addEventListener('click', () => {
    document.execCommand('italic', false, null);
    tbody.focus();
});

underlineBtn.addEventListener('click', () => {
    document.execCommand('underline', false, null);
    tbody.focus();
});
*/

//--------------------------UNDO REDO---------------------------------//

//==================================================
//FIND AND REPLACE
//==================================================

// Select elements
const findInput = document.querySelector('.find-box');
const replaceInput = document.querySelector('.replace-box');
const replaceBtn = document.querySelector('.replace-btn');
const matchCounter = document.querySelector('.match-counter span');
const tableBody = document.getElementById('tableBody');

// Function to get all cells
function getCells() {
    return tableBody.querySelectorAll('.cell');
}

// Find functionality - triggers as user types
findInput.addEventListener('input', () => {
    const searchTerm = findInput.value.trim().toLowerCase();
    const cells = getCells();
    
    // If search term is empty, clear highlights and reset counter
    if (!searchTerm) {
        cells.forEach(cell => cell.classList.remove('highlight'));
        matchCounter.textContent = '0';
        return;
    }
    
    let matchCount = 0;
    cells.forEach(cell => {
        const text = cell.value.toLowerCase(); // Use value instead of textContent
        if (text.includes(searchTerm)) {
            cell.classList.add('highlight');
            matchCount++;
        } else {
            cell.classList.remove('highlight');
        }
    });
    matchCounter.textContent = matchCount;
});

// Replace functionality - triggers on button click
replaceBtn.addEventListener('click', () => {
    const searchTerm = findInput.value.trim();
    const replaceTerm = replaceInput.value;
    if (!searchTerm) return; // Do nothing if no search term
    
    const cells = getCells();
    cells.forEach(cell => {
        if (cell.classList.contains('highlight')) {
            const regex = new RegExp(searchTerm, 'gi'); // Case-insensitive replacement
            cell.value = cell.value.replace(regex, replaceTerm); // Use value instead of textContent
            cell.classList.remove('highlight');
        }
    });
    matchCounter.textContent = '0'; // Reset counter after replacement
});

//====================================================
//TABLE OPTIONS
//====================================================


//-------------------------------ADD NEW ROW--------------------------------------//

function addNewRow() {
    rowCount++;
    const tbody = document.getElementById('tableBody');
    const row = document.createElement('tr');
    
    const rowData = {
        //serialNo: rowCount,
        date: '',
        toWhom: '',
        toWhomHindi: '',
        place: '',
        placeHindi: '',
        subject: '',
        subjectHindi: '',
        sentBy: '',
        sentByHindi: ''
    };
    tableData.push(rowData);
    row.innerHTML = `
        <td class="row-number">${rowCount}</td>
        <td><input type="text" class="cell" required data-row="${rowCount-1}" data-field="date" placeholder="Enter date..."></td>
        <td>
            <input id = "r1" type="text" class="cell english-cell" required data-row="${rowCount-1}" data-field="toWhom" placeholder="Enter recipient..." style = "word-wrap: break-word;">
            <input type="text" class="cell hindi-cell" data-row="${rowCount-1}" data-field="toWhomHindi" placeholder="Hindi translation..." disabled>
        </td>
        <td>
            <input type="text" class="cell english-cell" required data-row="${rowCount-1}" data-field="place" placeholder="Enter place...">
            <input type="text" class="cell hindi-cell" data-row="${rowCount-1}" data-field="placeHindi" placeholder="Hindi translation..." disabled>
        </td>
        <td>
            <input type="text" class="cell english-cell" required data-row="${rowCount-1}" data-field="subject" placeholder="Enter subject...">
            <input type="text" class="cell hindi-cell" data-row="${rowCount-1}" data-field="subjectHindi" placeholder="Hindi translation..." disabled>
        </td>
        <td>
            <input type="text" class="cell english-cell" required data-row="${rowCount-1}" data-field="sentBy" placeholder="Mode of sending...">
            <input type="text" class="cell hindi-cell" data-row="${rowCount-1}" data-field="sentByHindi" placeholder="Hindi translation..." disabled>
        </td>
     
    `;

    tbody.appendChild(row);
    
    const cells = row.querySelectorAll('.cell');
    cells.forEach(cell => {
        addCellEventListeners(cell);
    });

    addRowInsertionListeners(row);
}

//-------------------------------------MOVE TO NEXT CELL---------------------------------------------//

function moveToNextCell(currentCell) {
    const allCells = document.querySelectorAll('.cell');
    const currentIndex = Array.from(allCells).indexOf(currentCell);
    
    if (currentIndex < allCells.length - 1) {
        allCells[currentIndex + 1].focus();
    } else {
        addNewRow();
        setTimeout(() => {
            const newCells = document.querySelectorAll('.cell');
            newCells[newCells.length - 10].focus();
        }, 100);
    }
}

//----------------------------------------SORT COLUMN---------------------------------------------//

function sortColumn(field, order) {
    syncTableDataWithDOM();
    
    tableData.sort((a, b) => {
        let aValue = a[field] || '';
        let bValue = b[field] || '';
        
        if (field === 'date') {
            aValue = parseDate(aValue);
            bValue = parseDate(bValue);
        } else {
            aValue = aValue.toString().toLowerCase();
            bValue = bValue.toString().toLowerCase();
        }
        
        return order === 'asc' ? 
            (aValue > bValue ? 1 : -1) : 
            (aValue < bValue ? 1 : -1);
    });
    
    rebuildTable();
    applyAllFilters();
    document.querySelectorAll('.sort-dropdown').forEach(d => d.classList.remove('show'));
}

//-------------------------------------SEARCH SPECIFIC COLUMN-----------------------------------------//

function searchColumn(column) {
    const input = document.querySelector(`input[data-column="${column}"]`);
    const searchTerm = input.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        clearColumnSearch(column);
        return;
    }
    
    columnFilters[column] = searchTerm;
    applyAllFilters();
    
    
    document.getElementById(`sort-${column}`).classList.remove('show');
}

//--------------------------------------CLEAR COLUMN SEARCH-----------------------------------------//

function clearColumnSearch(column) {
    const input = document.querySelector(`input[data-column="${column}"]`);
    input.value = '';
    delete columnFilters[column];
    applyAllFilters();
}

//-------------------------------------APPLY ALL ACTIVE FILTERS--------------------------------------//

function applyAllFilters() {
    const tbody = document.getElementById('tableBody');
    const rows = tbody.querySelectorAll('tr');
    let visibleCount = 0;
    
    rows.forEach((row, index) => {
        let showRow = true;
        
        for (const [column, searchTerm] of Object.entries(columnFilters)) {
            const cellValue = getCellValueByColumn(row, column).toLowerCase();
            if (!cellValue.includes(searchTerm)) {
                showRow = false;
                break;
            }
        }
        
        if (showRow) {
            row.style.display = '';
            row.classList.add('filtered-row');
            visibleCount++;
        } else {
            row.style.display = 'none';
            row.classList.remove('filtered-row');
        }
    });
    
    showNoResultsMessage(visibleCount === 0);
}


// Sync table data with DOM
function syncTableDataWithDOM() {
    const tbody = document.getElementById('tableBody');
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach((row, index) => {
        const cells = row.querySelectorAll('.cell');
        if (tableData[index]) {
            tableData[index].date = cells[0].value;
            tableData[index].toWhom = cells[1].value;
            tableData[index].toWhomHindi = cells[2].value;
            tableData[index].place = cells[3].value;
            tableData[index].placeHindi = cells[4].value;
            tableData[index].subject = cells[5].value;
            tableData[index].subjectHindi = cells[6].value;
            tableData[index].sentBy = cells[7].value;
            tableData[index].sentByHindi = cells[8].value;
        }
    });
}

//------------------------------------------TOGGLE SORT MENU-------------------------------------------//

function toggleSortMenu(column) {
    const dropdown = document.getElementById(`sort-${column}`);
    
    if (!dropdown) {
        console.error(`Dropdown element with ID 'sort-${column}' not found.`);
        return;
    }
    
    // Close all other dropdowns
    document.querySelectorAll('.sort-dropdown').forEach(d => {
        if (d !== dropdown) d.classList.remove('show');
    });
    
    dropdown.classList.toggle('show');
    
    // Close dropdown when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeDropdown(e) {
            if (!dropdown.contains(e.target) && !e.target.closest('.hamburger-btn')) {
                dropdown.classList.remove('show');
                document.removeEventListener('click', closeDropdown);
            }
        });
    }, 0);
}

//ROW INSERTION

function setupRowInsertion() {
    const tbody = document.getElementById('tableBody');
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
        addRowInsertionListeners(row);
    });
}

// ADD ROW LISTENERS

function addRowInsertionListeners(row) {
    const insertBtn = document.createElement('div');
    insertBtn.className = 'insert-row-btn';
    insertBtn.innerHTML = '+ Insert Row';
    insertBtn.style.display = 'none';
    
    row.style.position = 'relative';
    row.appendChild(insertBtn);
    
    row.addEventListener('mouseenter', function() {
        insertBtn.style.display = 'block';
    });
    
    row.addEventListener('mouseleave', function() {
        insertBtn.style.display = 'none';
    });
    
    insertBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        insertRowAfter(row);
    });
    
    row.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showContextMenu(e, row);
    });
}

//======================================================
//SMALL FEATURES
//=====================================================

// INSERT ROW AFTER ANOTHER ROW

function insertRowAfter(targetRow) {
    const tbody = document.getElementById('tableBody');
    const targetIndex = Array.from(tbody.children).indexOf(targetRow);
    
    rowCount++;
    const newRow = document.createElement('tr');
    
    const rowData = {
        //serialNo: rowCount,
        date: '',
        toWhom: '',
        toWhomHindi: '',
        place: '',
        placeHindi: '',
        subject: '',
        subjectHindi: '',
        sentBy: '',
        sentByHindi: ''
    };
    tableData.splice(targetIndex + 1, 0, rowData);
    
    newRow.innerHTML = `
        <td class="row-number">${rowCount}</td>
        <td><input type="text" class="cell" required data-row="${targetIndex + 1}" data-field="date" placeholder="dd-mm-yyyy"></td>
        <td>
            <input type="text" class="cell english-cell" required data-row="${targetIndex + 1}" data-field="toWhom" placeholder="Enter recipient...">
            <input type="text" class="cell hindi-cell" data-row="${targetIndex + 1}" data-field="toWhomHindi" placeholder="Hindi translation..." disabled>
        </td>
        <td>
            <input type="text" class="cell english-cell" required data-row="${targetIndex + 1}" data-field="place" placeholder="Enter place...">
            <input type="text" class="cell hindi-cell" data-row="${targetIndex + 1}" data-field="placeHindi" placeholder="Hindi translation..." disabled>
        </td>
        <td>
            <input type="text" class="cell english-cell" required data-row="${targetIndex + 1}" data-field="subject" placeholder="Enter subject...">
            <input type="text" class="cell hindi-cell" data-row="${targetIndex + 1}" data-field="subjectHindi" placeholder="Hindi translation..." disabled>
        </td>
        <td>
            <input type="text" class="cell english-cell" required data-row="${targetIndex + 1}" data-field="sentBy" placeholder="Mode of sending...">
            <input type="text" class="cell hindi-cell" data-row="${targetIndex + 1}" data-field="sentByHindi" placeholder="Hindi translation..." disabled>
        </td>
    `;
    
    targetRow.parentNode.insertBefore(newRow, targetRow.nextSibling);
    
    const cells = newRow.querySelectorAll('.cell');
    cells.forEach(cell => {
        addCellEventListeners(cell);
    });
    
    addRowInsertionListeners(newRow);
    updateRowNumbers();
    cells[0].focus();
}

//UPDATE ROW NUMBERS
function updateRowNumbers() {
    const tbody = document.getElementById('tableBody');
    const rows = tbody.querySelectorAll('tr');
    const startIdx = (currentPage - 1) * entriesPerPage;
    rows.forEach((row, index) => {
        const rowNumberCell = row.querySelector('.row-number');
        if (rowNumberCell) {
            rowNumberCell.textContent = startIdx + index + 1;
        }
    });
}

//SHOW CONTEXT MENUS

function showContextMenu(event, row) {
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) existingMenu.remove();
    
    const contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.innerHTML = `
        <div class="context-menu-item" data-action="insert-above">Insert Row Above</div>
        <div class="context-menu-item" data-action="insert-below">Insert Row Below</div>
        <div class="context-menu-item" data-action="delete-row">Delete Row</div>
    `;
    
    contextMenu.style.position = 'absolute';
    contextMenu.style.left = event.pageX + 'px';
    contextMenu.style.top = event.pageY + 'px';
    contextMenu.style.zIndex = '1000';
    
    document.body.appendChild(contextMenu);
    
    contextMenu.addEventListener('click', function(e) {
        const action = e.target.getAttribute('data-action');
        const tbody = document.getElementById('tableBody');
        const targetIndex = Array.from(tbody.children).indexOf(row);
        
        switch(action) {
            case 'insert-above':
                insertRowAt(targetIndex);
                break;
            case 'insert-below':
                insertRowAfter(row);
                break;
            case 'delete-row':
                deleteRow(row, targetIndex);
                break;
        }
        
        contextMenu.remove();
    });
    
    document.addEventListener('click', function removeMenu() {
        contextMenu.remove();
        document.removeEventListener('click', removeMenu);
    });
}

//INSERT ROW AT INDEX

function insertRowAt(index) {
    const tbody = document.getElementById('tableBody');
    const rows = tbody.querySelectorAll('tr');
    if (index === 0) insertRowBefore(rows[0]);
    else insertRowAfter(rows[index - 1]);
}

// INSERT ROW BEFORE TARGET

function insertRowBefore(targetRow) {
    const tbody = document.getElementById('tableBody');
    const targetIndex = Array.from(tbody.children).indexOf(targetRow);
    
    rowCount++;
    const newRow = document.createElement('tr');
    
    const rowData = {
        serialNo: rowCount,
        date: '',
        toWhom: '',
        toWhomHindi: '',
        place: '',
        placeHindi: '',
        subject: '',
        subjectHindi: '',
        sentBy: '',
        sentByHindi: ''
    };
    tableData.splice(targetIndex, 0, rowData);
    
    newRow.innerHTML = `
        <td class="row-number">${rowCount}</td>
        <td><input type="text" class="cell" required data-row="${targetIndex}" data-field="date" placeholder="Enter date..."></td>
        <td>
            <input type="text" class="cell english-cell" required data-row="${targetIndex}" data-field="toWhom" placeholder="Enter recipient...">
            <input type="text" class="cell hindi-cell" data-row="${targetIndex}" data-field="toWhomHindi" placeholder="Hindi translation..." disabled>
        </td>
        <td>
            <input type="text" class="cell english-cell" required data-row="${targetIndex}" data-field="place" placeholder="Enter place...">
            <input type="text" class="cell hindi-cell" data-row="${targetIndex}" data-field="placeHindi" placeholder="Hindi translation..." disabled>
        </td>
        <td>
            <input type="text" class="cell english-cell" required data-row="${targetIndex}" data-field="subject" placeholder="Enter subject...">
            <input type="text" class="cell hindi-cell" data-row="${targetIndex}" data-field="subjectHindi" placeholder="Hindi translation..." disabled>
        </td>
        <td>
            <input type="text" class="cell english-cell" required data-row="${targetIndex}" data-field="sentBy" placeholder="Mode of sending...">
            <input type="text" class="cell hindi-cell" data-row="${targetIndex}" data-field="sentByHindi" placeholder="Hindi translation..." disabled>
        </td>
    `;
    
    targetRow.parentNode.insertBefore(newRow, targetRow);
    
    const cells = newRow.querySelectorAll('.cell');
    cells.forEach(cell => {
        addCellEventListeners(cell);
    });
    
    addRowInsertionListeners(newRow);
    updateRowNumbers();
    cells[0].focus();
}

//DELETE ROW

function deleteRow(row, index) {
    const tbody = document.getElementById('tableBody');
    if (tbody.children.length <= 1) {
        alert('Cannot delete the last row!');
        return;
    }
    
    tableData.splice(index, 1);
    row.remove();
    updateRowNumbers();
    rowCount--;
}

//ADD CELL EVENT LISTENERS

function addCellEventListeners(cell) {
    if (cell.getAttribute('data-field') === 'date') {
        cell.placeholder = 'dd/mm/yyyy';
        cell.addEventListener('input', () => restrictDateInput(cell));
        cell.addEventListener('blur', () => restrictDateInput(cell));  // Validate on blur too
    }

    cell.addEventListener('focus', function() {
        this.classList.add('editing');
        this.select();
    });

    cell.addEventListener('blur', async function() {
        this.classList.remove('editing');
        await saveData(this);
    });

    cell.addEventListener('keydown', async function(e) {
        if (e.key === 'Enter') {
            this.blur();
            moveToNextCell(this);
        } else if (e.key === 'Tab') {
            e.preventDefault();
            this.blur();
            moveToNextCell(this);
        }
    });

    cell.addEventListener('input', debounce(async function() {
        await saveData(this);
    }, 300)); 
}

//----------------------------------------------SAVE THINGY-------------------------------------------//

//==============================================
// DATABASE INTEGRATION FUNCTIONS
//==============================================

// Validate row data - checks if all required fields are filled
function validateRowData(rowData, rowIndex) {
    const requiredFields = ['date', 'toWhom', 'place', 'subject', 'sentBy'];
    const missingFields = [];
    
    for (const field of requiredFields) {
        if (!rowData[field] || rowData[field].trim() === '') {
            missingFields.push(field);
        }
    }
    
    if (missingFields.length > 0) {
        return {
            isValid: false, 
            error: `Row ${rowIndex + 1}: Missing required fields - ${missingFields.join(', ')}`
        };
    }
    
    return { isValid: true };
}

// Get filled rows from table data
function getFilledRows() {
    const filledRows = [];
    const validationErrors = [];
    let foundFirstEmpty = false; 
    
        for (let index = 0; index < tableData.length; index++) {
            const rowData = tableData[index];
            // Check if at least one field is filled (excluding serialNo)
            const hasData = Object.values(rowData).some(value =>
                value && value.toString().trim() !== '' && value !== index + 1
            );
        
            if (hasData) {
                if (foundFirstEmpty) {
                    validationErrors.push(
                        `Row ${index}: Has empty fields. Please fill all required fields before Saving.` // rows in-between cannot be empty 
                    );
                }
                const validation = validateRowData(rowData, index);
                if (validation.isValid) {
                    filledRows.push({
                        ...rowData,
                        serialNo: index + 1
                    });
                } else {
                    validationErrors.push(validation.error);
                }
            }
            else{
                foundFirstEmpty = true; // mark that we found an empty row
            }
        }
    return { filledRows, validationErrors };
}
//=============================
//SAVE TO DATABASE
//=============================

async function saveToDatabase() {
    // Check authentication first
    if (!isAuthenticated()) {
        alert('Please login first to save data.');
        window.location.href = 'login.html';
        return;
    }

    // CONFIRM SAVING
    const confirmSave = confirm('Are you sure you want to save the data? Double check before saving!');
    if (!confirmSave) {
        return;
    }
    
    console.log('🔄 Save button clicked - starting save process...');
    
    try {
        // Show loading state
        const saveBtn = document.querySelector('.save-btn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '⏳ Saving...';
        saveBtn.disabled = true;
        
        console.log('📋 Current tableData:', tableData.length, 'rows');
        
        // Sync table data with DOM first
        syncTableDataWithDOM();
        console.log('✅ Table data synced with DOM');
        
        // Get filled and validated rows
        const { filledRows, validationErrors } = getFilledRows();
        
        console.log('📊 Processed data:', {
            totalRows: tableData.length,
            filledRows: filledRows.length,
            validationErrors: validationErrors.length,
            filledData: filledRows
        });
        
        // If there are validation errors, show them and stop
        if (validationErrors.length > 0) {
            console.warn('⚠️ Validation errors found:', validationErrors);
            alert('❌ Validation Errors:\n\n' + validationErrors.join('\n\n') + '\n\nPlease fill all required fields before saving.');
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
            return;
        }
        
        // If no filled rows, show message
        if (filledRows.length === 0) {
            console.warn('⚠️ No filled rows found');
            alert('ℹ️ No data to save.\n\nPlease fill at least one complete row with all required fields:\n• Date\n• To Whom Sent\n• Place\n• Subject\n• Sent By');
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
            return;
        }
        
        console.log('🚀 Sending authenticated data to server...');
        
        // Send data to backend with authentication headers
        const response = await fetch('/api/despatch/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`  // Add the token here
            },
            body: JSON.stringify({
                data: filledRows
            })
        });
        
        console.log('📡 Server response status:', response.status);
        
        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
            removeAuthToken();
            alert('Session expired. Please login again.');
            window.location.href = 'login.html';
            return;
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ Server response:', result);
        
        if (result.success) {
            saveBtn.textContent = '✅ Saved!';
            setTimeout(() => {
                saveBtn.textContent = originalText;
            }, 3000);
            alert(`✅ Successfully saved ${result.rowsSaved || filledRows.length} rows to database!`);
        } else {
            throw new Error(result.error || 'Failed to save data');
        }
        
    } catch (error) {
        console.error('❌ Save error:', error);
        alert('❌ Error saving data:\n\n' + error.message + '\n\nPlease check:\n• Your internet connection\n• Server is running\n• Database connection\n• Browser console for more details');
    } finally {
        // Reset button state
        const saveBtn = document.querySelector('.save-btn');
        if (!saveBtn.textContent.includes('✅')) {
            saveBtn.textContent = 'Save';
        }
        saveBtn.disabled = false;
    }
}


//============================================
//TRANSLATION
//============================================

async function translateText(text) {
    // Check cache first
    if (translationCache.has(text)) {
        return translationCache.get(text);
    }
    
    try {
        //api key
        const response = await fetch("https://d-jaden02-en-hi-helsinki-model.hf.space/translate", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                max_length: 512
            })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.translated_text) {
            const translated = data.translated_text;
            translationCache.set(text, translated);
            return translated;
        } else {
            throw new Error(data.error || 'Invalid response from translation API');
        }
    } catch (error) {
        console.error('Translation error:', error);
        return text;
    } 
}

//FASTER TRANSLATION ALT

async function translateTextBatch(texts) {
    try {
        const response = await fetch("https://d-jaden02-en-hi-helsinki-model.hf.space/batch_translate", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                texts: texts,
                max_length: 512
            })
        });
        
        if (!response.ok) {
            throw new Error(`Batch API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.results) {
            const translations = {};
            data.results.forEach((result, index) => {
                if (!result.error && result.translated_text) {
                    translations[texts[index]] = result.translated_text;
                    translationCache.set(texts[index], result.translated_text);
                } else {
                    translations[texts[index]] = texts[index]; // Fallback to original
                }
            });
            return translations;
        } else {
            throw new Error('Invalid batch response from translation API');
        }
    } catch (error) {
        console.error('Batch translation error:', error);
        // Return original texts as fallback
        const fallback = {};
        texts.forEach(text => fallback[text] = text);
        return fallback;
    }
}

//SAVE DATA AND HANDLE TRANSLATION

async function saveData(cell) {
    const row = parseInt(cell.getAttribute('data-row'));
    const field = cell.getAttribute('data-field');
    const value = cell.value;

    if (tableData[row]) {
        tableData[row][field] = value;

        // Handle automatic translation
        if (translatableColumns.includes(field) && !field.endsWith('Hindi') && value) {
            const hindiField = `${field}Hindi`;
            const hindiInput = document.querySelector(`input[data-row="${row}"][data-field="${hindiField}"]`);
            if (hindiInput) {
                const translatedText = await translateText(value);
                hindiInput.value = translatedText;
                hindiInput.disabled = false; 
                tableData[row][hindiField] = translatedText;
            }
        }
    }
}
//================================
// CONFIRM LOGOUT
//================================

document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?Remember To Save')) {
                window.location.href = 'login.html';
            }
        });
    }
});

// View as PDF

/*function viewPdf() {
    const element = document.getElementById('excelTable');
    html2pdf()
        .from(element)
            .set({
                margin: [0, 1, 1, 0], 
                filename: 'output.pdf',
                image: { type: 'jpeg', quality: 0.99 }, 
                html2canvas: {
                    scale: 7, 
                    useCORS: true, 
                    width: element.scrollWidth, 
                    height: element.scrollHeight, 
                },
                jsPDF: {
                    unit: 'mm',
                    format: 'a3', 
                    orientation: 'portrait',  
                    compress: false, 
                }
            })
        .toPdf()
        .output('blob')
        .then(blob => {
            const url = URL.createObjectURL(blob);
            window.open(url);
        });
}*/
//=====================================
// REBUILD DATA FOR NO OF ENTRIES
//===================================== 

function rebuildTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    // Ensure enough rows for the current page
    const requiredRows = entriesPerPage * currentPage;
    while (tableData.length < requiredRows) {
        const rowData = {
            date: '',
            toWhom: '',
            toWhomHindi: '',
            place: '',
            placeHindi: '',
            subject: '',
            subjectHindi: '',
            sentBy: '',
            sentByHindi: ''
        };
        tableData.push(rowData);
    }

    // PAGINATION LOGIC
    const startIdx = (currentPage - 1) * entriesPerPage;
    const endIdx = Math.min(startIdx + entriesPerPage, tableData.length);
    const pageRows = tableData.slice(startIdx, endIdx);

    pageRows.forEach((rowData, index) => {
        const serialNumber = startIdx + index + 1; // Sequential number for current page
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="row-number">${serialNumber}</td>
            <td><input type="text" class="cell" required data-row="${startIdx + index}" data-field="date" placeholder="Enter date..." value="${rowData.date || ''}"></td>
            <td>
                <input type="text" class="cell english-cell" required data-row="${startIdx + index}" data-field="toWhom" placeholder="Enter recipient..." value="${rowData.toWhom || ''}">
                <input type="text" class="cell hindi-cell" data-row="${startIdx + index}" data-field="toWhomHindi" placeholder="Hindi translation..." value="${rowData.toWhomHindi || ''}" ${rowData.toWhomHindi ? '' : 'disabled'}>
            </td>
            <td>
                <input type="text" class="cell english-cell" required data-row="${startIdx + index}" data-field="place" placeholder="Enter place..." value="${rowData.place || ''}">
                <input type="text" class="cell hindi-cell" data-row="${startIdx + index}" data-field="placeHindi" placeholder="Hindi translation..." value="${rowData.placeHindi || ''}" ${rowData.placeHindi ? '' : 'disabled'}>
            </td>
            <td>
                <input type="text" class="cell english-cell" required data-row="${startIdx + index}" data-field="subject" placeholder="Enter subject..." value="${rowData.subject || ''}">
                <input type="text" class="cell hindi-cell" data-row="${startIdx + index}" data-field="subjectHindi" placeholder="Hindi translation..." value="${rowData.subjectHindi || ''}" ${rowData.subjectHindi ? '' : 'disabled'}>
            </td>
            <td>
                <input type="text" class="cell english-cell" required data-row="${startIdx + index}" data-field="sentBy" placeholder="Mode of sending..." value="${rowData.sentBy || ''}">
                <input type="text" class="cell hindi-cell" data-row="${startIdx + index}" data-field="sentByHindi" placeholder="Hindi translation..." value="${rowData.sentByHindi || ''}" ${rowData.sentByHindi ? '' : 'disabled'}>
            </td>
        `;
        tbody.appendChild(row);

        const cells = row.querySelectorAll('.cell');
        cells.forEach(cell => {
            addCellEventListeners(cell);
        });
        addRowInsertionListeners(row);
    });

    renderPaginationControls();
}
//==========================================================
// PAGINATION CONTROLS FOR GOING FROM ONE PAGE TO ANOTHER
//==========================================================

function renderPaginationControls() {
    let pagination = document.getElementById('pagination-controls');
    if (!pagination) {
        pagination = document.createElement('div');
        pagination.id = 'pagination-controls';
        pagination.style.margin = '10px 0';
        pagination.style.textAlign = 'center';
        document.getElementById('excelTable').after(pagination);
    }

    const totalPages = Math.ceil(tableData.length / entriesPerPage);
    pagination.innerHTML = `
        <button ${currentPage === 1 ? 'disabled' : ''} id="prevPageBtn">Previous</button>
        <span> Page ${currentPage} of ${totalPages} </span>
        <button ${currentPage === totalPages ? 'disabled' : ''} id="nextPageBtn">Next</button>
    `;

    document.getElementById('prevPageBtn').onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            rebuildTable();
        }
    };
    document.getElementById('nextPageBtn').onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            rebuildTable();
        }
    };
}
