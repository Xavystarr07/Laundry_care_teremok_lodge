============================================================
  MONTHLY STATEMENT — FILE STRUCTURE GUIDE
============================================================

monthly_statement/
│
├── monthly_statement.php       ← MAIN FILE (entry point)
│
├── php/
│   ├── db.php                  ← DATABASE — change password/host here
│   ├── queries.php             ← SQL QUERIES — change what data loads
│   └── actions.php             ← FORM ACTIONS — add new statement types
│
├── css/
│   ├── base.css                ← BODY, FONTS, HEADINGS
│   ├── header.css              ← TOP HEADER LAYOUT
│   ├── table.css               ← STATEMENT TABLE
│   ├── buttons.css             ← ALL BUTTONS
│   ├── forms.css               ← DROPDOWNS, DATE INPUTS
│   └── print.css               ← PRINT-ONLY STYLES
│
├── js/
│   ├── grandTotal.js           ← FUEL LEVY CALCULATOR
│   ├── print.js                ← PRINT FUNCTION
│   └── navigation.js          ← BACK BUTTON
│
└── partials/
    ├── header.html             ← BUSINESS NAME, ADDRESS, RECIPIENT
    ├── hotel_form.html         ← HOTEL DROPDOWN + BUTTONS
    └── banking.html            ← BANK ACCOUNT DETAILS

============================================================
  HOW TO INSTALL
============================================================

1. Extract this folder into:
   C:\xampp\htdocs\Laundry_care\Invoice App\

2. Open php/db.php — replace YOUR-PASSWORD-HERE with your
   actual Supabase password

3. Delete your old monthly_statement.php from Invoice App root

4. Visit in browser:
   http://localhost/Laundry_care/Invoice%20App/monthly_statement/monthly_statement.php

============================================================
  QUICK EDIT GUIDE — what to open when something breaks
============================================================

Something broke            → Open this file
─────────────────────────────────────────────────────────
Can't connect to database  → php/db.php
Wrong data showing         → php/queries.php
Button not working         → php/actions.php  +  js/navigation.js
Table looks wrong          → css/table.css
Buttons look wrong         → css/buttons.css
Header layout broken       → css/header.css  +  partials/header.html
Print looks wrong          → css/print.css
Fuel levy not calculating  → js/grandTotal.js
Hotel missing from list    → partials/hotel_form.html
Bank details wrong         → partials/banking.html
Page background/fonts      → css/base.css
============================================================
