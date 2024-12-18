const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const xlsx = require("xlsx");
const app = express();
const port = 3000;

// Serve static files (like CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());

// Route to serve the HTML file at the root URL
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Route to handle saving driver information to Excel (POST request)
app.post("/save-driver", (req, res) => {
    try {
        const newDriver = req.body;

        // Read the current data from the Excel file
        const workbook = xlsx.readFile("drivers.xlsx");
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const drivers = xlsx.utils.sheet_to_json(sheet);

        // Add the new driver to the list
        drivers.push(newDriver);

        // Save the updated list back to the Excel file
        const newSheet = xlsx.utils.json_to_sheet(drivers);
        workbook.Sheets[workbook.SheetNames[0]] = newSheet;
        xlsx.writeFile(workbook, "drivers.xlsx");

        res.status(200).send("Driver saved successfully!");
    } catch (error) {
        console.error("Error saving driver data:", error);
        res.status(500).send("There was an error saving the driver data.");
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
