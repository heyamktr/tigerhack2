const express = require('express');
const xlsx = require('xlsx');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = 4060;

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Function to read data from Excel files
function readExcelData(filePath) {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(sheet); // Convert sheet data to JSON
}

// Function to verify driver by studentId
function verifyDriver(studentId) {
    const driversData = readExcelData(path.join(__dirname, 'driver.xlsx'));
    return driversData.find(driver => driver.studentId == studentId);
}

// Function to match passengers with a specific driver
function getMatchingPassengersForDriver(studentId) {
    const driversData = readExcelData(path.join(__dirname, 'driver.xlsx'));
    const passengersData = readExcelData(path.join(__dirname, 'passengers.xlsx'));

    const driver = driversData.find(d => d.studentId == studentId);

    if (!driver) {
        throw new Error(`Driver with studentId ${studentId} not found.`);
    }

    const matchingPassengers = passengersData
        .filter(passenger => passenger.destination == driver.location)
        .filter(passenger => {
            const passengerTimeDiff = new Date(passenger.returnTime) - new Date(passenger.scheduledTime);
            const driverTimeDiff = new Date(driver.returnTime) - new Date(driver.scheduledTime);
            return passengerTimeDiff >= driverTimeDiff + 3600000; // At least 1-hour buffer
        })
        .filter(passenger => {
            return (
                passenger.tripType == driver.tripType ||
                (passenger.tripType == 'round' && driver.tripType == 'one-way') ||
                (passenger.tripType == 'one-way' && driver.tripType == 'round')
            );
        });

    return matchingPassengers;
}

// Endpoint to verify driver
app.get('/verifyDriver', (req, res) => {
    const { studentId } = req.query;

    if (!studentId) {
        return res.status(400).json({ error: 'Student ID is required.' });
    }

    const driver = verifyDriver(studentId);

    if (driver) {
        res.json({ success: true, message: 'Driver verified successfully.', driver });
    } else {
        res.status(404).json({ error: 'Driver not found or invalid Student ID.' });
    }
});

// Endpoint to get matching passengers for a verified driver
app.get('/getMatchingPassengers', (req, res) => {
    const { studentId } = req.query;

    if (!studentId) {
        return res.status(400).json({ error: 'Student ID is required.' });
    }

    try {
        const matchingPassengers = getMatchingPassengersForDriver(studentId);

        if (matchingPassengers.length > 0) {
            res.json(matchingPassengers);
        } else {
            res.status(404).json({ error: 'No matching passengers found.' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to allow driver to select a passenger
// Submit Passenger Selection
app.post('/submitSelection', (req, res) => {
    const { studentId, passengers: selectedPassengers } = req.body;
    const drivers = readExcelData(path.join(__dirname, 'driver.xlsx'));
    const passengers = readExcelData(path.join(__dirname, 'passengers.xlsx'));

    const driver = drivers.find(d => d.studentId == studentId);
    if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
    }

    if (!selectedPassengers || selectedPassengers.length == 0) {
        return res.status(400).json({ error: 'No passengers selected' });
    }

    // Find the selected passenger by name
    const selectedPassenger = passengers.find(p => selectedPassengers.includes(p.passengerName));

    if (!selectedPassenger) {
        return res.status(404).json({ error: 'Selected passenger not found' });
    }

    // Here you can process the selected passengers (e.g., store the selection in a database)
    console.log(`Driver with ID ${driver.studentId} has selected passenger: ${selectedPassenger.passengerName}`);

    // Respond with success message including driver studentId and passenger name
    res.json({
        success: true,
        message: `Driver ID ${driver.studentId} successfully selected passenger: ${selectedPassenger.passengerName}`,
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
