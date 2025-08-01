//=========================
//START
//=========================

let rowCount = 0;
let tableData = [];
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
//INITIALIZE TABLE
//==========================================
function initializeTable() {
    for (let i = 0; i < 6; i++) {
        addNewRow();
    }
    setupRowInsertion();
    
    // Add event listeners with null checks
    const addRowBtn = document.querySelector('.add-row-btn');
    if (addRowBtn) addRowBtn.addEventListener('click', addNewRow);
    const pdfBtn = document.querySelector('.pdf-btn');
    //if (pdfBtn) pdfBtn.addEventListener('click', viewPdf);
    
    // NEW: Add save and load button listeners
    const saveBtn = document.querySelector('.save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveToDatabase);
        console.log('✅ Save button listener attached');
    } else {
        console.error('❌ Save button not found!');
    }
    //if (loadBtn) loadBtn.addEventListener('click', loadFromDatabase);
    //const clearBtn = document.querySelector('.clear-btn');
    //if (clearBtn) clearBtn.addEventListener('click', clearTable);
    
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

    //loadFromDatabase();
    
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
//FONT
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
let undoStack = [];
let redoStack = [];
let maxUndoSteps = 50;

// Initialize the formatting system
function initializeTextFormatting() {
    console.log('Initializing text formatting...');
    
    // Make all table cells editable
    makeTableCellsEditable();
    
    // Set up button event listeners
    setupFormattingButtons();
    
    // Set up keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Update button states initially
    updateUndoRedoButtons();
}

// Make table cells editable
function makeTableCellsEditable() {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) {
        console.error('Table body not found');
        return;
    }

    // Make existing cells editable
    const cells = tableBody.querySelectorAll('td');
    cells.forEach(cell => {
        setupCellEditing(cell);
    });

    // Observer to handle dynamically added rows
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

// Setup individual cell editing
function setupCellEditing(cell) {
    cell.contentEditable = true;
    cell.style.cursor = 'text';
    
    cell.addEventListener('focus', function(e) {
        currentEditingCell = this;
        saveUndoState();
        console.log('Cell focused:', this);
    });

    cell.addEventListener('blur', function(e) {
        currentEditingCell = null;
        updateFormattingButtonStates();
    });

    cell.addEventListener('keyup', function(e) {
        updateFormattingButtonStates();
    });

    cell.addEventListener('mouseup', function(e) {
        updateFormattingButtonStates();
    });
}

// Setup formatting buttons
function setupFormattingButtons() {
    // Bold button
    const boldBtn = document.getElementById('boldBtn');
    if (boldBtn) {
        boldBtn.addEventListener('click', function(e) {
            e.preventDefault();
            toggleBold();
        });
    }

    // Italic button
    const italicBtn = document.getElementById('italicsBtn');
    if (italicBtn) {
        italicBtn.addEventListener('click', function(e) {
            e.preventDefault();
            toggleItalic();
        });
    }

    // Underline button
    const underlineBtn = document.getElementById('underlineBtn');
    if (underlineBtn) {
        underlineBtn.addEventListener('click', function(e) {
            e.preventDefault();
            toggleUnderline();
        });
    }

    // Undo button
    const undoBtn = document.getElementById('undo');
    if (undoBtn) {
        undoBtn.addEventListener('click', function(e) {
            e.preventDefault();
            performUndo();
        });
    }

    // Redo button
    const redoBtn = document.getElementById('redo');
    if (redoBtn) {
        redoBtn.addEventListener('click', function(e) {
            e.preventDefault();
            performRedo();
        });
    }
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if (!currentEditingCell) return;

        // Check for Ctrl/Cmd key combinations
        if (e.ctrlKey || e.metaKey) {
            switch(e.key.toLowerCase()) {
                case 'b':
                    e.preventDefault();
                    toggleBold();
                    break;
                case 'i':
                    e.preventDefault();
                    toggleItalic();
                    break;
                case 'u':
                    e.preventDefault();
                    toggleUnderline();
                    break;
                case 'z':
                    if (e.shiftKey) {
                        e.preventDefault();
                        performRedo();
                    } else {
                        e.preventDefault();
                        performUndo();
                    }
                    break;
                case 'y':
                    e.preventDefault();
                    performRedo();
                    break;
            }
        }
    });
}

// Text formatting functions
function toggleBold() {
    if (!currentEditingCell) {
        alert('Please click on a cell first to start editing');
        return;
    }

    try {
        document.execCommand('bold', false, null);
        updateFormattingButtonStates();
        saveUndoState();
        console.log('Bold toggled');
    } catch (error) {
        console.error('Bold command failed:', error);
    }
}

function toggleItalic() {
    if (!currentEditingCell) {
        alert('Please click on a cell first to start editing');
        return;
    }

    try {
        document.execCommand('italic', false, null);
        updateFormattingButtonStates();
        saveUndoState();
        console.log('Italic toggled');
    } catch (error) {
        console.error('Italic command failed:', error);
    }
}

function toggleUnderline() {
    if (!currentEditingCell) {
        alert('Please click on a cell first to start editing');
        return;
    }

    try {
        document.execCommand('underline', false, null);
        updateFormattingButtonStates();
        saveUndoState();
        console.log('Underline toggled');
    } catch (error) {
        console.error('Underline command failed:', error);
    }
}

// Update button visual states
function updateFormattingButtonStates() {
    if (!currentEditingCell) return;

    try {
        const boldBtn = document.getElementById('boldBtn');
        const italicBtn = document.getElementById('italicsBtn');
        const underlineBtn = document.getElementById('underlineBtn');

        const isBold = document.queryCommandState('bold');
        const isItalic = document.queryCommandState('italic');
        const isUnderline = document.queryCommandState('underline');

        // Update bold button
        if (boldBtn) {
            if (isBold) {
                boldBtn.style.backgroundColor = '#4CAF50';
                boldBtn.style.color = 'white';
            } else {
                boldBtn.style.backgroundColor = '';
                boldBtn.style.color = '';
            }
        }

        // Update italic button
        if (italicBtn) {
            if (isItalic) {
                italicBtn.style.backgroundColor = '#4CAF50';
                italicBtn.style.color = 'white';
            } else {
                italicBtn.style.backgroundColor = '';
                italicBtn.style.color = '';
            }
        }

        // Update underline button
        if (underlineBtn) {
            if (isUnderline) {
                underlineBtn.style.backgroundColor = '#4CAF50';
                underlineBtn.style.color = 'white';
            } else {
                underlineBtn.style.backgroundColor = '';
                underlineBtn.style.color = '';
            }
        }
    } catch (error) {
        console.error('Error updating button states:', error);
    }
}

// Undo/Redo functionality
function saveUndoState() {
    if (!currentEditingCell) return;

    const state = {
        cell: currentEditingCell,
        content: currentEditingCell.innerHTML,
        timestamp: Date.now()
    };

    undoStack.push(state);
    
    // Limit undo stack size
    if (undoStack.length > maxUndoSteps) {
        undoStack.shift();
    }

    // Clear redo stack when new action is performed
    redoStack = [];
    
    updateUndoRedoButtons();
}

function performUndo() {
    if (undoStack.length === 0) {
        console.log('Nothing to undo');
        return;
    }

    const currentState = undoStack.pop();
    
    if (currentState && currentState.cell && document.contains(currentState.cell)) {
        // Save current state to redo stack
        redoStack.push({
            cell: currentState.cell,
            content: currentState.cell.innerHTML,
            timestamp: Date.now()
        });

        // Restore previous state
        currentState.cell.innerHTML = currentState.content;
        
        // Focus the cell
        currentState.cell.focus();
        currentEditingCell = currentState.cell;
        
        console.log('Undo performed');
    }

    updateUndoRedoButtons();
}

function performRedo() {
    if (redoStack.length === 0) {
        console.log('Nothing to redo');
        return;
    }

    const redoState = redoStack.pop();
    
    if (redoState && redoState.cell && document.contains(redoState.cell)) {
        // Save current state to undo stack
        undoStack.push({
            cell: redoState.cell,
            content: redoState.cell.innerHTML,
            timestamp: Date.now()
        });

        // Restore redo state
        redoState.cell.innerHTML = redoState.content;
        
        // Focus the cell
        redoState.cell.focus();
        currentEditingCell = redoState.cell;
        
        console.log('Redo performed');
    }

    updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undo');
    const redoBtn = document.getElementById('redo');

    if (undoBtn) {
        if (undoStack.length > 0) {
            undoBtn.style.opacity = '1';
            undoBtn.style.cursor = 'pointer';
            undoBtn.disabled = false;
        } else {
            undoBtn.style.opacity = '0.5';
            undoBtn.style.cursor = 'not-allowed';
            undoBtn.disabled = true;
        }
    }

    if (redoBtn) {
        if (redoStack.length > 0) {
            redoBtn.style.opacity = '1';
            redoBtn.style.cursor = 'pointer';
            redoBtn.disabled = false;
        } else {
            redoBtn.style.opacity = '0.5';
            redoBtn.style.cursor = 'not-allowed';
            redoBtn.disabled = true;
        }
    }
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

    // Handle dropdown item selection
    dropdownItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault(); 
            const selectedValue = item.textContent; 
            entriesBtn.textContent = selectedValue; 
            splitBtnContainer.classList.remove('active');
            dropdownToggle.setAttribute('aria-expanded', 'false');
            console.log(`Selected number of entries: ${selectedValue}`);
        });
    });

    document.addEventListener('click', (e) => {
        if (!splitBtnContainer.contains(e.target)) {
            splitBtnContainer.classList.remove('active');
            dropdownToggle.setAttribute('aria-expanded', 'false');
        }
    });
});



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


//------------------------FIND AND REPLACE---------------------------//

document.addEventListener('DOMContentLoaded', () => {
    const findBox = document.querySelector('.find-box');
    const replaceBox = document.querySelector('.replace-box');
    const findBtn = document.querySelector('#findWord');
    const replaceBtn = document.querySelector('#replaceWord');
    const matchCounter = document.querySelector('.match-counter span');
    const tableBody = document.getElementById('tableBody');

    // Function to update match count
    function updateMatchCount() {
        const findText = findBox.value.trim();
        if (!findText) {
            matchCounter.textContent = '0';
            return;
        }
        let matchCount = 0;
        const cells = tableBody.querySelectorAll('td');
        const regex = new RegExp(findText, 'gi');
        cells.forEach(cell => {
            const matches = cell.textContent.match(regex) || [];
            matchCount += matches.length;
        });
        matchCounter.textContent = matchCount;
    }

    // Find button event listener
    findBtn.addEventListener('click', () => {
        updateMatchCount();
    });

    // Replace button event listener
    replaceBtn.addEventListener('click', () => {
        const findText = findBox.value.trim();
        const replaceText = replaceBox.value;
        if (!findText) return;

        const regex = new RegExp(findText, 'g');
        const cells = tableBody.querySelectorAll('td');
        cells.forEach(cell => {
            cell.textContent = cell.textContent.replace(regex, replaceText);
        });
        updateMatchCount();
    });

    // Update match count on input change
    findBox.addEventListener('input', updateMatchCount);
});

//---------------------------------------------------------------------------//
//---------------------------TABLE OPTIONS----------------------------------//
//-------------------------------------------------------------------------//

//----------------------Add New Row--------------------------------------//

function addNewRow() {
    rowCount++;
    const tbody = document.getElementById('tableBody');
    const row = document.createElement('tr');
    
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
    tableData.push(rowData);

    row.innerHTML = `
        <td class="row-number">${rowCount}</td>
        <td><input type="date" class="cell" required data-row="${rowCount-1}" data-field="date" placeholder="Enter date..."></td>
        <td>
            <input id = "r1" type="text" class="cell english-cell" required data-row="${rowCount-1}" data-field="toWhom" placeholder="Enter recipient...">
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

//------------------------------Move To Next Cell---------------------------------------------//

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

//----------------------------------------Sort Column---------------------------------------------//

function sortColumn(field, order) {
    syncTableDataWithDOM();
    
    tableData.sort((a, b) => {
        let aValue = a[field] || '';
        let bValue = b[field] || '';
        
        if (field === 'date') {
            aValue = new Date(aValue || '1900-01-01');
            bValue = new Date(bValue || '1900-01-01');
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

//-------------------------------------Search Specific Column-----------------------------------------//

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

//--------------------------------------Clear Column Search------------------------------------------//

function clearColumnSearch(column) {
    const input = document.querySelector(`input[data-column="${column}"]`);
    input.value = '';
    delete columnFilters[column];
    applyAllFilters();
}

//----------------------------------- Apply All Active Filters--------------------------------------//

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

//-----------------------------------Toggle Sort Menu-------------------------------------------//

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

// Setup row insertion

function setupRowInsertion() {
    const tbody = document.getElementById('tableBody');
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
        addRowInsertionListeners(row);
    });
}

// Add row insertion listeners
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

// Insert row after specified row

function insertRowAfter(targetRow) {
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
    tableData.splice(targetIndex + 1, 0, rowData);
    
    newRow.innerHTML = `
        <td class="row-number">${rowCount}</td>
        <td><input type="date" class="cell" required data-row="${targetIndex + 1}" data-field="date" placeholder="dd-mm-yyyy"></td>
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

// Update row numbers
function updateRowNumbers() {
    const tbody = document.getElementById('tableBody');
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach((row, index) => {
        const rowNumberCell = row.querySelector('.row-number');
        rowNumberCell.textContent = index + 1;
        
        const cells = row.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.setAttribute('data-row', index);
        });
    });
}

// Show context menu

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

// Insert row at index

function insertRowAt(index) {
    const tbody = document.getElementById('tableBody');
    const rows = tbody.querySelectorAll('tr');
    if (index === 0) insertRowBefore(rows[0]);
    else insertRowAfter(rows[index - 1]);
}

// Insert row before target

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
        <td><input type="date" class="cell" required data-row="${targetIndex}" data-field="date" placeholder="Enter date..."></td>
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

// Delete row

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

// Add cell event listeners

function addCellEventListeners(cell) {
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
    
    tableData.forEach((rowData, index) => {
        // Check if at least one field is filled
        const hasData = Object.values(rowData).some(value => 
            value && value.toString().trim() !== '' && value !== index + 1
        );
        
        if (hasData) {
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
    });
    
    return { filledRows, validationErrors };
}

// Save data to database
async function saveToDatabase() {
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
        
        console.log('🚀 Sending data to server...');
        
        // Send data to backend
        const response = await fetch('/api/despatch/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: filledRows
            })
        });
        
        console.log('📡 Server response status:', response.status);
        
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

// better performance

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

// Save data and handle translation

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

// Rebuild table
function rebuildTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    tableData.forEach((rowData, index) => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td class="row-number">${index + 1}</td>
            <td><input type="date" class="cell" required data-row="${index}" data-field="date" placeholder="Enter date..." value="${rowData.date || ''}"></td>
            <td>
                <input type="text" class="cell english-cell" required data-row="${index}" data-field="toWhom" placeholder="Enter recipient..." value="${rowData.toWhom || ''}">
                <input type="text" class="cell hindi-cell" data-row="${index}" data-field="toWhomHindi" placeholder="Hindi translation..." value="${rowData.toWhomHindi || ''}" ${rowData.toWhomHindi ? '' : 'disabled'}>
            </td>
            <td>
                <input type="text" class="cell english-cell" required data-row="${index}" data-field="place" placeholder="Enter place..." value="${rowData.place || ''}">
                <input type="text" class="cell hindi-cell" data-row="${index}" data-field="placeHindi" placeholder="Hindi translation..." value="${rowData.placeHindi || ''}" ${rowData.placeHindi ? '' : 'disabled'}>
            </td>
            <td>
                <input type="text" class="cell english-cell" required data-row="${index}" data-field="subject" placeholder="Enter subject..." value="${rowData.subject || ''}">
                <input type="text" class="cell hindi-cell" data-row="${index}" data-field="subjectHindi" placeholder="Hindi translation..." value="${rowData.subjectHindi || ''}" ${rowData.subjectHindi ? '' : 'disabled'}>
            </td>
            <td>
                <input type="text" class="cell english-cell" required data-row="${index}" data-field="sentBy" placeholder="Mode of sending..." value="${rowData.sentBy || ''}">
                <input type="text" class="cell hindi-cell" data-row="${index}" data-field="sentByHindi" placeholder="Hindi translation..." value="${rowData.sentByHindi || ''}" ${rowData.sentByHindi ? '' : 'disabled'}>
            </td>
        `;
        
        tbody.appendChild(row);
        
        const cells = row.querySelectorAll('.cell');
        cells.forEach(cell => {
            addCellEventListeners(cell);
        });
        
        addRowInsertionListeners(row);
    });
}

// Initialize on load

window.addEventListener('load', initializeTable);