const express = require("express");
const xlsx = require("xlsx");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const port = 5000;

// Middleware to parse incoming JSON data
app.use(bodyParser.json());

// Serve static HTML files (make sure the HTML file is in the 'public' folder)
app.use(express.static(path.join(__dirname, "public")));

// Endpoint to save driver data to Excel
app.post("/save-driver", (req, res) => {
    const driverData = req.body;
    const filePath = path.join(__dirname, "data.xlsx");

    // Check if the file exists and load it
    let workbook;
    let drivers = [];
    try {
        workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        drivers = xlsx.utils.sheet_to_json(sheet);
    } catch (error) {
        console.log("Excel file not found, creating a new one.");
    }

    // Add the new driver data to the list
    drivers.push(driverData);

    // Convert the data to a sheet and write it to the file
    const newSheet = xlsx.utils.json_to_sheet(drivers);
    const newWorkbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(newWorkbook, newSheet, "Drivers");
    xlsx.writeFile(newWorkbook, filePath);

    res.json({ message: "Driver information saved successfully." });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
