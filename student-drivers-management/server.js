const express = require("express");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 4900;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
// Route to serve the HTML file at the root URL
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "driver_info.html"));
});

// Utility functions for Excel file handling
function readExcelFile(filePath, defaultHeaders = []) {
    if (fs.existsSync(filePath)) {
        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        return xlsx.utils.sheet_to_json(sheet);
    } else if (defaultHeaders.length > 0) {
        // Initialize file with headers if it doesn't exist
        const workbook = xlsx.utils.book_new();
        const sheet = xlsx.utils.aoa_to_sheet([defaultHeaders]);
        xlsx.utils.book_append_sheet(workbook, sheet, "Sheet1");
        xlsx.writeFile(workbook, filePath);
        return [];
    }
    return [];
}
function readExcelData(filePath) {
    if (fs.existsSync(filePath)) {
        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        return xlsx.utils.sheet_to_json(sheet); // Convert sheet to JSON
    }
    return []; // Return empty array if the file doesn't exist
}

function writeExcelFile(filePath, data, headers) {
    const sheet = xlsx.utils.json_to_sheet(data, { header: headers });
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, sheet, "Sheet1");
    xlsx.writeFile(workbook, filePath);
}
function writeExcelData(filePath, data, headers) {
    const sheet = xlsx.utils.json_to_sheet(data, { header: headers });
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, sheet, "Sheet1");
    xlsx.writeFile(workbook, filePath);
}


// File paths
const driverFilePath = path.join(__dirname, "data.xlsx");
const passengerFilePath = path.join(__dirname, "availablepassengers.xlsx");
const tripFilePath = path.join(__dirname, "driver_with_trip.xlsx");

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

// Endpoint: Fetch Passenger Data
app.get("/passenger-data", (req, res) => {
    const passengers = readExcelFile(passengerFilePath, ["ID", "passengerName", "pickupLocation", "destination", "scheduledTime", "returnTime", "numPassengers", "tripType"]);

    if (passengers.length > 0) {
        res.json({ success: true, passengers });
    } else {
        res.status(404).json({ success: false, message: "No passenger data found." });
    }
});
// Endpoint: Accept Trip
app.post('/accept-trip', (req, res) => {
    const { driverId, passengers: selectedPassengers } = req.body;

    if (!driverId || !selectedPassengers || selectedPassengers.length == 0) {
        return res.status(400).json({ error: "Driver ID and selected passengers are required." });
    }

    // Fetch driver and passenger details
    const drivers = readExcelData(path.join(__dirname, 'data.xlsx'));
    const passengers = readExcelData(path.join(__dirname, 'availablepassengers.xlsx'));
    const driver = drivers.find(d => d.studentId == driverId);

    if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
    }

    // Check if the driver has already selected a passenger
    const driverWithTrips = readExcelData(path.join(__dirname, 'driver_with_trip.xlsx'));
    const existingTrip = driverWithTrips.find(trip => trip.driverId == driverId);

    if (existingTrip) {
        return res.status(400).json({ error: 'Driver has already selected a passenger.' });
    }

    // Find the selected passenger(s)
    const selectedPassenger = passengers.find(passenger => passenger.ID == selectedPassengers[0]);

    if (!selectedPassenger) {
        return res.status(404).json({ error: 'Selected passenger not found' });
    }

    // Add the selected passenger along with the driver information to the 'driver_with_trip' list
    const newTrip = {
        driverId: driver.studentId,
        driverName: driver.studentName,
        driverLocation: driver.location,
        driverScheduledTime: driver.scheduledTime,
        driverReturnTime: driver.returnTime,
        passengerId: selectedPassenger.ID,
        passengerName: selectedPassenger.Name,
        passengerPickupLocation: selectedPassenger.Pickup,
        passengerDestination: selectedPassenger.Destination,
        passengerScheduledTime: selectedPassenger.scheduledTime,
        passengerReturnTime: selectedPassenger.returnTime,
        passengerTripType: selectedPassenger.tripType,
        tripStatus: 'In Progress',
    };

    driverWithTrips.push(newTrip);

    // Write back the updated driver_with_trip data to the file
    writeExcelData(path.join(__dirname, 'driver_with_trip.xlsx'), driverWithTrips);

    
    // Respond with success message
    res.json({
        success: true,
        message: `Trip accepted successfully! You have selected passenger with ID: ${selectedPassenger.ID}`,
    });
});


// Endpoint: Finish Trip
app.post('/finish-trip', (req, res) => {
    const { driverId } = req.body;

    if (!driverId) {
        return res.status(400).json({ error: "Driver ID is required." });
    }

    // Fetch driver, passenger, and trip details
    const drivers = readExcelData(path.join(__dirname, 'data.xlsx'));
    const passengers = readExcelData(path.join(__dirname, 'availablepassengers.xlsx'));
    const trips = readExcelData(path.join(__dirname, 'driver_with_trip.xlsx')); // Trips data is now in driver_with_trip.xlsx

    // Find the driver
    const driver = drivers.find(driver => driver.studentId == driverId);

    if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
    }

    // Find the trip associated with the driver
    const trip = trips.find(trip => trip.driverId == driverId && trip.tripStatus == "In Progress");

    if (!trip) {
        return res.status(404).json({ error: 'No ongoing trip found for the specified driver.' });
    }

    // Find the associated passenger
    const passenger = passengers.find(passenger => passenger.passengerName == trip.passengerName);

    if (!passenger) {
        return res.status(404).json({ error: 'Passenger not found.' });
    }

    // Mark the trip as completed (change trip status)
    trip.tripStatus = "Completed";

    // Write back the updated trip data to the driver_with_trip.xlsx file
    writeExcelData(path.join(__dirname, 'driver_with_trip.xlsx'), trips);

    // Remove the driver and passenger from their respective lists
    const updatedDrivers = drivers.filter(d => d.studentId !== driverId);
    const updatedPassengers = passengers.filter(p => p.passengerName !== trip.passengerName);

    // Write the updated driver and passenger data back to the files
    writeExcelData(path.join(__dirname, 'data.xlsx'), updatedDrivers);
    writeExcelData(path.join(__dirname, 'availablepassengers.xlsx'), updatedPassengers);

    // Respond with success message
    res.json({
        success: true,
        message: "Trip finished successfully. Driver and passenger removed from their respective lists."
    });
});

// Route to verify the driver code
app.post("/verify-driver-code", (req, res) => {
    const { driverId } = req.body;

    if (!driverId) {
        return res.status(400).json({ success: false, message: "Driver ID is required." });
    }

    // Check if the driver code exists in the "drivers with trips" list
    const result = verifyDriverCode(driverId);

    if (result.success) {
        res.status(200).json({ 
            success: true, 
            message: "Driver ID verified.", 
            driver: result.driver 
        });
    } else {
        res.status(404).json({ 
            success: false, 
            message: result.message 
        });
    }
});

// Function to verify driver ID in the "drivers with trips" list
const verifyDriverCode = (driverId) => {
    const driversWithTripsFilePath = path.join(__dirname, "driver_with_trip.xlsx");

    try {
        // Check if the "drivers with trips" file exists
        if (!fs.existsSync(driversWithTripsFilePath)) {
            return { success: false, message: "Drivers with trips list not found." };
        }

        // Read the Excel file
        const workbook = xlsx.readFile(driversWithTripsFilePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const driversWithTrips = xlsx.utils.sheet_to_json(sheet);

        // Search for the driver in the list
        const driver = driversWithTrips.find(driver => driver.driverId == driverId);

        if (!driver) {
            return { success: false, message: "Driver ID not found in the active trips list." };
        }

        // Return success if driver is found
        return { success: true, driver };
    } catch (error) {
        console.error("Error verifying driver ID:", error);
        return { success: false, message: "Internal server error." };
    }
};

//Matching Algorithm
// Function to verify driver by studentId
function verifyDriver(studentId) {
    const driversData = readExcelData(path.join(__dirname, 'data.xlsx'));
    return driversData.find(driver => driver.studentId == studentId);
}

// Function to match passengers with a specific driver
function getMatchingPassengersForDriver(studentId) {
    const driversData = readExcelData(path.join(__dirname, 'data.xlsx'));
    const passengersData = readExcelData(path.join(__dirname, 'availablepassengers.xlsx'));

    const driver = driversData.find(d => d.studentId == studentId);

    if (!driver) {
        throw new Error(`Driver with studentId ${studentId} not found.`);
    }

    const matchingPassengers = passengersData
        .filter(passenger => passenger.destination == driver.location)
        .filter(passenger => {
            const passengerTimeDiff = new Date(passenger.returnTime) - new Date(passenger.scheduledTime);
            const driverTimeDiff = new Date(driver.returnTime) - new Date(driver.scheduledTime);
            return passengerTimeDiff >= driverTimeDiff + 3600000; // At least 1-hour buffer; 
        })
        .filter(passenger => {
            return (
                passenger.tripType == driver.tripType ||
                (passenger.tripType == 'round' && driver.tripType == 'one-way') ||
                (passenger.tripType == 'one-way' && driver.tripType == 'round')
            );
        })
        .filter(passenger => driver.capacity > passenger.numPassengers); 

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

// Submit Passenger Selection
app.post('/submitSelection', (req, res) => {
    const { studentId, passengers: selectedPassengers } = req.body;
    const drivers = readExcelData(path.join(__dirname, 'data.xlsx'));
    const passengers = readExcelData(path.join(__dirname, 'availablepassengers.xlsx'));
    const driver = drivers.find(d => d.studentId == studentId);

    if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
    }

    if (!selectedPassengers || selectedPassengers.length == 0) {
        return res.status(400).json({ error: 'No passengers selected' });
    }

    // Check if the driver has already selected a passenger
    const driverWithTrips = readExcelData(path.join(__dirname, 'driver_with_trip.xlsx'));
    const existingTrip = driverWithTrips.find(trip => trip.driverId == studentId);

    if (existingTrip) {
        return res.status(400).json({ error: 'Driver has already selected a passenger.' });
    }

    const selectedPassenger = passengers.find(passenger => passenger.passengerName == selectedPassengers[0]);;

    if (!selectedPassenger) {
        return res.status(404).json({ error: 'Selected passenger not found' });
    }
    

    // Add the selected passenger along with the driver information to the 'driver_with_trip' list
    const newTrip = {
        driverId: driver.studentId,
        driverName: driver.studentName,
        driverLocation: driver.location,
        driverScheduledTime: driver.scheduledTime,
        driverReturnTime: driver.returnTime,
        passengerId: selectedPassenger.ID, // Store passengerId instead of passengerName
        passengerName: selectedPassenger.passengerName, // Optional: still store passenger name if needed
        passengerPickupLocation: selectedPassenger.pickupLocation,
        passengerDestination: selectedPassenger.destination,
        passengerScheduledTime: selectedPassenger.scheduledTime,
        passengerReturnTime: selectedPassenger.returnTime,
        passengerTripType: selectedPassenger.tripType,
        tripStatus: 'In Progress',
    };

    driverWithTrips.push(newTrip);

    // Write back the updated driver_with_trip data to the file
    writeExcelData(path.join(__dirname, 'driver_with_trip.xlsx'), driverWithTrips);

    // Respond with success message
    res.json({
        success: true,
        message: `Selection successful! You have selected passenger with ID: ${selectedPassenger.ID}`,
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
