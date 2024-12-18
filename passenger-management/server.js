const express = require('express');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();

// Enable CORS
app.use(cors());

// Middleware to parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.get('/get-drivers', (req, res) => {
    try {
        const filePath = './available-drivers.xlsx';
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Excel file not found' });
        }

        // Read the data from the Excel file
        const workbook = xlsx.readFile(filePath);
        const sheetName = 'Drivers'; // Assuming the sheet containing driver data is named 'Drivers'
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        console.log(`drivers data:`, data)
        // Return the available driver data
        res.json({ drivers: data });
    } catch (error) {
        console.error('Error reading driver data:', error);
        res.status(500).json({ error: 'Failed to load driver data.' });
    }
});

// Endpoint to handle form submission
app.post('/save-passenger', (req, res) => {
    try {
        const filePath = './data.xlsx'; // Path to the Excel file
        const { passengerName, phoneNumber, email, numPassengers, pickupLocation, destination, tripType, scheduledTime, returnTime } = req.body;

        // Validate input
        if (!passengerName || !phoneNumber || !email || !numPassengers || !pickupLocation || !destination || !tripType || !scheduledTime) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        let workbook;
        let data = [];
        if (fs.existsSync(filePath)) {
            workbook = xlsx.readFile(filePath);
            const sheetName = 'Passengers';
            data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
            //console.log(`data:`, data);
        } else {
            workbook = xlsx.utils.book_new();
        }

        // Add new entry, including the scheduled time if it exists
        data.push({
            passengerName,
            phoneNumber,
            email,
            numPassengers,
            pickupLocation,
            destination,
            tripType,
            scheduledTime,
            returnTime
        });

        // Write updated data back to Excel
        const newSheet = xlsx.utils.json_to_sheet(data);
        const newWorkbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(newWorkbook, newSheet, "Passengers");
        xlsx.writeFile(newWorkbook, "data.xlsx");
        res.json({ message: 'Passenger information saved successfully!' });
        window.location.href = "available-drivers.html";
    } catch (error) {
        console.error('Error saving passenger data:', error);
        res.status(500).json({ error: 'An error occurred while saving data.' });
    }
});


// Endpoint to retrieve passenger data
app.get('/get-passengers', (req, res) => {
    try {
        const filePath = './data.xlsx'; // Path to the Excel file
        if (!fs.existsSync(filePath)) {
            // If file doesn't exist, return an empty list
            return res.json({ passengers: [] });
        }

        // Read data from the Excel file
        const workbook = xlsx.readFile(filePath);
        const sheetName = 'Passengers'; // Assuming the first sheet contains the data
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // Return the passenger data
        res.json({ passengers: data });
    } catch (error) {
        console.error('Error reading passengers:', error);
        res.status(500).json({ error: 'Failed to load passengers.' });
    }
});

// Start the server
const PORT = 4000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
