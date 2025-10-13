![logo](https://github.com/D-Jaden/DAK-Register/blob/main/public/images/NIC-Logo-white.png)
# NIC DAK LOGBOOK

--------------------------------------------------------
## ABOUT THE PROJECT 
It is a **web-based logbook system** designed to manage and track **Despatch** and **Acquired** records efficiently.  
The application provides a **secure login and registration system**, intuitive data management tables, and advanced features such as sorting, filtering, inline editing, and PDF viewing — all in one streamlined interface.  

Users can register with their basic details, log in securely, and seamlessly switch between Despatch and Acquired tables. Each account maintains its own data, ensuring personalized access and record persistence.

## WHAT TO INSTALL ?
Make sure you have the following installed before running the project:  

- **Node.js** (v16 or above)
- **Express.js**
- **PostgreSQL** (latest version recommended)  
- **npm**
- **VSCode** or any IDE to run javascript 

## HOW TO RUN ?
- git clone https://github.com/D-Jaden/DAK-Register
- cd DAK-Register
- npm run dev (make sure you have insaleed the necessary npm packages mentioned in the node_modules)
- Go to http://localhost:3000

## FEATURES
### 🔐 Authentication  
- User **Registration** with:
  - First Name, Last Name, Phone Number fields.
  - Captcha verification and Agreement checkbox.
- **Login** using registered Phone Number.
- Input validation ensures:
  - Only numeric values are accepted in the phone number field.
  - Duplicate accounts are not created even if the name is capitalized differently.
- Registered data is securely stored and retrieved for each user.

---

### 📊 Logbook Interface  
- Two separate tables: **Despatch** and **Acquired**.
- A **Switch Button** allows toggling between the two tables easily.
- Both tables share the same functionalities:
  - **Text Formatting Tools** — change font size, style, bold, italic, and underline text.
  - **Find & Replace** functionality for quick editing.
  - **Dynamic Row Display** — view up to 100 rows (default: 6).
  - **Inbuilt PDF Viewer** to preview exported or related documents directly in the app.
  - **Search and Filter Columns** with ascending and descending sorting.
  - **Add Row Button** to insert new rows.
  - **Right-click Menu** to:
    - Add a row above or below.
    - Delete selected rows.
- When a user logs in, all previously saved Despatch and Acquired data is automatically loaded from their account.

---

## 🗄️ Database  

- The project uses **PostgreSQL** for backend data storage.  
- All user registration details and table data are saved securely in the database.  
- Existing **database setup and configuration instructions** are provided in the repository.  
- Key aspects:
  - Each user’s Despatch and Acquired records are stored separately.
  - Ensures persistent and reliable data retrieval upon login.
  - Supports structured data management for scalability and multi-user handling.

---

## FUTURE UPDATES

Planned future enhancements include:

- 🌙 **Dark Mode UI** for better accessibility and aesthetics.  
- 👥 **Role-Based Access Control (RBAC)** — separate permissions for Admins and Users.  
- 📤 **Export Options** — ability to export data as Excel or CSV files.  
- 🔔 **Notification System** — instant alerts for new entries or updates.  
- 📈 **Dashboard Analytics** — visualize Despatch and Acquired trends over time.  
- 💾 **Auto-Save Feature** — periodic data saving to prevent accidental loss.  
- 🧩 **Enhanced Security** — improved password encryption and validation logic.
- **Better Responsiveness** — ability to respond to different devices better

---
