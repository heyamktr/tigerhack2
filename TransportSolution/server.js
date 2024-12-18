const express = require('express');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const csvParser = require('csv-parser');
const { writeToPath } = require('fast-csv');


const app = express();

// Enable CORS
app.use(cors());

// Middleware to parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));


/* !!!   Passenger Management   !!! */

// Endpoint to handle form submission
app.post('/save-passenger', (req, res) => {
    try {
        const filePath = './Studentdriver_availablepassengers.xlsx'; // Path to the Excel file
        const { ID, Name, email, numPassengers, Pickup, Destination, tripType, scheduledTime, returnTime } = req.body;

        // Validate input
        if (!ID || !Name || !email || !numPassengers || !Pickup || !Destination || !tripType || !scheduledTime) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        let workbook;
        let data = [];
        if (fs.existsSync(filePath)) {
            workbook = xlsx.readFile(filePath);
            const sheetName = 'Sheet1';
            data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
            //console.log(`data:`, data);
        } else {
            workbook = xlsx.utils.book_new();
        }

        // Add new entry, including the scheduled time if it exists
        data.push({
            ID,
            Name,
            email,
            numPassengers,
            Pickup,
            Destination,
            tripType,
            scheduledTime,
            returnTime
        });

        // Write updated data back to Excel
        const newSheet = xlsx.utils.json_to_sheet(data);
        const newWorkbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(newWorkbook, newSheet, "Sheet1");
        xlsx.writeFile(newWorkbook, "Studentdriver_availablepassengers.xlsx");
        res.json({ message: 'Passenger information saved successfully!' });
        window.location.href = "available-drivers.html";
    } catch (error) {
        console.error('Error saving passenger data:', error);
        res.status(500).json({ error: 'An error occurred while saving data.' });
    }
});

/* !!!   Student Drivers Management   !!! */
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
const driverFilePath = path.join(__dirname, "Studentdriver_data.xlsx");
const passengerFilePath = path.join(__dirname, "Studentdriver_availablepassengers.xlsx");
const tripFilePath = path.join(__dirname, "Studentdriver_with_trip.xlsx");

// Endpoint to save driver data to Excel
app.post("/save-driver", (req, res) => {
    const driverData = req.body;
    const filePath = path.join(__dirname, "Studentdriver_data.xlsx");

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
app.get("/passenger-data1", (req, res) => {
    const passengers = readExcelFile(passengerFilePath, ["ID", "passengerName", "pickupLocation", "destination", "scheduledTime", "returnTime", "numPassengers", "tripType"]);
    console.log(`passengers`, passengers.length);
    if (passengers.length > 0) {
        res.json({ success: true, passengers });
    } else {
        res.status(404).json({ success: false, message: "No passenger data found." });
    }
});
// Endpoint: Accept Trip
app.post('/accept-trip1', (req, res) => {
    const { driverId, passengers: selectedPassengersId } = req.body;

    //console.log(passengers);

    if (!driverId || !selectedPassengersId || selectedPassengersId.lengthId == 0) {
        return res.status(400).json({ error: "Driver ID and selected passengers are required." });
    }

    // Fetch driver and passenger details
    const drivers = readExcelData(path.join(__dirname, 'Studentdriver_data.xlsx'));
    const passengers = readExcelData(path.join(__dirname, 'Studentdriver_availablepassengers.xlsx'));
    const driver = drivers.find(d => d.studentId == driverId);

    if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
    }

    // Check if the driver has already selected a passenger
    const driverWithTrips = readExcelData(path.join(__dirname, 'Studentdriver_with_trip.xlsx'));
    const existingTrip = driverWithTrips.find(trip => trip.driverId == driverId);

    /*
    if (existingTrip) {
        return res.status(400).json({ error: 'Driver has already selected a passenger.' });
    }
    */

    // Find the selected passenger(s)
    const selectedPassengerId = passengers.find(passenger => passenger.ID == selectedPassengersId[0]);

    if (!selectedPassengerId) {
        return res.status(404).json({ error: 'Selected passenger not found' });
    }

    // Add the selected passenger along with the driver information to the 'driver_with_trip' list
    const newTrip = {
        driverId: driver.studentId,
        driverName: driver.studentName,
        driverLocation: driver.location,
        driverScheduledTime: driver.scheduledTime,
        driverReturnTime: driver.returnTime,
        passengerId: selectedPassengerId.ID,
        passengerName: selectedPassengerId.Name,
        passengerPickupLocation: selectedPassengerId.Pickup,
        passengerDestination: selectedPassengerId.Destination,
        passengerScheduledTime: selectedPassengerId.scheduledTime,
        passengerReturnTime: selectedPassengerId.returnTime,
        passengerTripType: selectedPassengerId.tripType,
        tripStatus: 'In Progress',
    };

    driverWithTrips.push(newTrip);

    // Write back the updated driver_with_trip data to the file
    writeExcelData(path.join(__dirname, 'Studentdriver_with_trip.xlsx'), driverWithTrips);

    
    // Respond with success message
    res.json({
        success: true,
        message: `Trip accepted successfully! You have selected passenger with ID: ${selectedPassengerId.ID}`,
    });
});


// Endpoint: Finish Trip
app.post('/finish-trip', (req, res) => {
    const { driverId } = req.body;

    if (!driverId) {
        return res.status(400).json({ error: "Driver ID is required." });
    }

    // Fetch driver, passenger, and trip details
    const drivers = readExcelData(path.join(__dirname, 'Studentdriver_data.xlsx'));
    const passengers = readExcelData(path.join(__dirname, 'Studentdriver_availablepassengers.xlsx'));
    const trips = readExcelData(path.join(__dirname, 'Studentdriver_with_trip.xlsx')); // Trips data is now in driver_with_trip.xlsx

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
    writeExcelData(path.join(__dirname, 'Studentdriver_with_trip.xlsx'), trips);

    // Remove the driver and passenger from their respective lists
    const updatedDrivers = drivers.filter(d => d.studentId !== driverId);
    const updatedPassengers = passengers.filter(p => p.passengerName !== trip.passenger.passengerName);

    // Write the updated driver and passenger data back to the files
    writeExcelData(path.join(__dirname, 'Studentdriver_data.xlsx'), updatedDrivers);
    writeExcelData(path.join(__dirname, 'Studentdriver_availablepassengers.xlsx'), updatedPassengers);

    // Respond with success message
    res.json({
        success: true,
        message: "Trip finished successfully."
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
    const driversWithTripsFilePath = path.join(__dirname, "Studentdriver_with_trip.xlsx");

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
    const driversData = readExcelData(path.join(__dirname, 'Studentdriver_data.xlsx'));
    return driversData.find(driver => driver.studentId == studentId);
}

// Function to match passengers with a specific driver
function getMatchingPassengersForDriver(studentId) {
    const driversData = readExcelData(path.join(__dirname, 'Studentdriver_data.xlsx'));
    const passengersData = readExcelData(path.join(__dirname, 'Studentdriver_availablepassengers.xlsx'));

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
    const drivers = readExcelData(path.join(__dirname, 'Studentdriver_data.xlsx'));
    const passengers = readExcelData(path.join(__dirname, 'Studentdriver_availablepassengers.xlsx'));
    const driver = drivers.find(d => d.studentId == studentId);

    if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
    }

    if (!selectedPassengers || selectedPassengers.length == 0) {
        return res.status(400).json({ error: 'No passengers selected' });
    }

    // Check if the driver has already selected a passenger
    const driverWithTrips = readExcelData(path.join(__dirname, 'Studentdriver_with_trip.xlsx'));
    const existingTrip = driverWithTrips.find(trip => trip.driverId == studentId);

    if (existingTrip) {
        return res.status(400).json({ error: 'Driver has already selected a passenger.' });
    }

    const selectedPassenger = passengers.find(passenger => passenger.passengerName == selectedPassengers[0]);

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
    writeExcelData(path.join(__dirname, 'Studentdriver_with_trip.xlsx'), driverWithTrips);

    // Respond with success message
    res.json({
        success: true,
        message: `Selection successful! You have selected passenger with ID: ${selectedPassenger.ID}`,
    });
});

/* !!!   Local Drivers Management   !!! */
/*
const readExcelFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            const workbook = xlsx.readFile(filePath);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            return xlsx.utils.sheet_to_json(sheet);
        } else {
            return [];
        }
    } catch (error) {
        console.error(`Error reading file: ${filePath}`, error);
        return [];
    }
};
*/

// Helper function to write to Excel file
/*
const writeExcelFile = (filePath, data) => {
    const sheet = xlsx.utils.json_to_sheet(data);
    const newWorkbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(newWorkbook, sheet, path.basename(filePath, '.xlsx'));
    xlsx.writeFile(newWorkbook, filePath);
};
*/

// Route to serve the HTML file at the root URL
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "localDrivers_create-account.html"));
});

// Endpoint to create driver account
app.post("/signup", (req, res) => {
    const { name, id, phone, email } = req.body;
    const uniqueCode = Math.random().toString(36).toUpperCase();

    // Read the current driver data
    let drivers = readExcelFile("localdrivers.xlsx");

    // Add the new driver
    const newDriver = { name, phone, email, uniqueCode };
    drivers.push(newDriver);

    // Write back the updated data
    writeExcelFile("localdrivers.xlsx", drivers);

    res.json({ uniqueCode });
});

// Driver login
app.post("/driver-login", (req, res) => {
    const { uniqueCode } = req.body;
    const drivers = readExcelFile("localdrivers.xlsx");

    const driver = drivers.find(driver => driver.uniqueCode === uniqueCode);
    if (driver) {
        res.status(200).json({ success: true, message: "Driver found." });
    } else {
        res.status(404).json({ success: false, message: "Driver not found. Please check your unique code." });
    }
});

// Get driver data by unique code
app.get("/driver-data", (req, res) => {
    const { uniqueCode } = req.query;

    // Read data from "localdrivers.xlsx"
    const drivers = readExcelFile("localdrivers.xlsx");

    // Find the driver by unique code
    const driver = drivers.find(driver => driver.uniqueCode === uniqueCode);

    if (driver) {
        res.status(200).json({
            success: true,
            driver: {
                Name: driver.name,
                Phone: driver.phone,
                Email: driver.email,
                TripsCompleted: driver.TripsCompleted || 0, // Include completed trips
                Available: driver.Available || false,
            },
            feedback: driver.Feedback || ["Great driver!", "Very punctual."],
        });
    } else {
        res.status(404).json({ success: false, message: "Driver not found." });
    }
});

// Update Driver Availability Status
app.post("/update-availability", (req, res) => {
    const { uniqueCode, available } = req.body;
    const drivers = readExcelFile("localdrivers.xlsx");
    const availableDrivers = readExcelFile("localDrivers_available_drivers.xlsx");

    const driverIndex = drivers.findIndex(driver => driver.uniqueCode === uniqueCode);
    if (driverIndex === -1) {
        return res.status(404).json({ success: false, message: "Driver not found." });
    }

    // Update the availability status
    drivers[driverIndex].Available = available;
    if (available) {
        availableDrivers.push(drivers[driverIndex]);
    } else {
        const index = availableDrivers.findIndex(driver => driver.uniqueCode === uniqueCode);
        if (index !== -1) availableDrivers.splice(index, 1);
    }

    // Save the changes back to the Excel files
    writeExcelFile("localdrivers.xlsx", drivers);
    writeExcelFile("localDrivers_available_drivers.xlsx", availableDrivers);

    res.status(200).json({ success: true, message: "Availability updated." });
});

// Route to cancel driver availability
app.post("/cancel-availability", (req, res) => {
    const { uniqueCode } = req.body;
    const filePath = path.join(__dirname, "localdrivers.xlsx");
    const availableDriversFilePath = path.join(__dirname, "localDrivers_available_drivers.xlsx");

    try {
        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const drivers = xlsx.utils.sheet_to_json(sheet);

        const driverIndex = drivers.findIndex(driver => driver.uniqueCode === uniqueCode);

        if (driverIndex !== -1) {
            // Update the driver's availability status to unavailable
            drivers[driverIndex].Available = false;

            // Read the available drivers file
            let availableDrivers = [];
            try {
                const availableWorkbook = xlsx.readFile(availableDriversFilePath);
                const availableSheet = availableWorkbook.Sheets[availableWorkbook.SheetNames[0]];
                availableDrivers = xlsx.utils.sheet_to_json(availableSheet);
            } catch (error) {
                console.log("Available drivers file not found, creating a new one.");
            }
             // Remove the driver from the available drivers list
             availableDrivers = availableDrivers.filter(driver => driver.uniqueCode !== uniqueCode);

             // Write back the updated available drivers list
             const availableSheet = xlsx.utils.json_to_sheet(availableDrivers);
             const availableWorkbook = xlsx.utils.book_new();
             xlsx.utils.book_append_sheet(availableWorkbook, availableSheet, "AvailableDrivers");
             xlsx.writeFile(availableWorkbook, availableDriversFilePath);
 
             // Save the updated data back to the main drivers Excel file
             const updatedSheet = xlsx.utils.json_to_sheet(drivers);
             workbook.Sheets[workbook.SheetNames[0]] = updatedSheet;
             xlsx.writeFile(workbook, filePath);
 
             res.status(200).json({ success: true, message: "Driver availability updated to unavailable." });
         } else {
             res.status(404).json({ success: false, message: "Driver not found." });
         }
     } catch (error) {
         console.error("Error canceling availability:", error);
         res.status(500).json({ success: false, message: "Internal server error." });
     }
 });


let selectedPassengerId = null;  // Store selected passenger ID for the driver

// Route to get all potential passengers from the Excel file
app.get("/passenger-data", (req, res) => {
    const filePath = path.join(__dirname, "localDrivers_availablepassengers.xlsx");

    try {
        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const passengers = xlsx.utils.sheet_to_json(sheet);

        res.status(200).json({
            success: true,
            passengers: passengers.map(p => ({
                ID: p.ID,
                Name: p.Name,
                Pickup: p.Pickup,
                Destination: p.Destination,
            })),
        });
    } catch (error) {
        console.error("Error fetching passenger data:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
});

// Endpoint: Verify Driver ID
app.get("/verify-driver-id", (req, res) => {
    const { uniqueCode } = req.query; // Use uniqueCode from the query

    if (!uniqueCode) {
        return res.status(400).json({ success: false, message: "Driver code is required." });
    }

    const drivers = readExcelFile("localDrivers_available_drivers.xlsx"); // Read from the correct file
    const driverExists = drivers.find(driver => driver.uniqueCode === uniqueCode); // Match uniqueCode field

    if (driverExists) {
        res.json({ success: true, message: "Driver verified." });
    } else {
        res.status(404).json({ success: false, message: "Driver not found." });
    }
});


// Function to move driver from available list to drivers with trips
const moveDriverToInProgress = (driverCode, passengerId) => {
    const availableDriversFilePath = path.join(__dirname, "localDrivers_available_drivers.xlsx");
    const driversWithTripsFilePath = path.join(__dirname, "localDrivers_drivers_with_trips.xlsx");
    const availablePassengersFilePath = path.join(__dirname, "localDrivers_availablepassengers.xlsx");

    try {
        // Read available drivers list
        let availableDrivers = [];
        const availableWorkbook = xlsx.readFile(availableDriversFilePath);
        const availableSheet = availableWorkbook.Sheets[availableWorkbook.SheetNames[0]];
        availableDrivers = xlsx.utils.sheet_to_json(availableSheet);

        // Find the driver from the available list
        const driverIndex = availableDrivers.findIndex(driver => driver.uniqueCode === driverCode);
        if (driverIndex == -1) {
            return { success: false, message: "Driver not found in available list." };
        }
        const driver = availableDrivers[driverIndex];

        // Read available passengers list
        let availablePassengers = [];
        const availablePassengersWorkbook = xlsx.readFile(availablePassengersFilePath);
        const availablePassengersSheet = availablePassengersWorkbook.Sheets[availablePassengersWorkbook.SheetNames[0]];
        availablePassengers = xlsx.utils.sheet_to_json(availablePassengersSheet);

        // Find the passenger by ID
        const passenger = availablePassengers.find(p => p.ID == passengerId);
        if (!passenger) {
            return { success: false, message: "Passenger not found." };
        }

        // Remove the driver from the available drivers list
        availableDrivers.splice(driverIndex, 1);
        // Write the updated available drivers list back to the Excel file
        const updatedAvailableSheet = xlsx.utils.json_to_sheet(availableDrivers);
        const updatedAvailableWorkbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(updatedAvailableWorkbook, updatedAvailableSheet, "AvailableDrivers");
        xlsx.writeFile(updatedAvailableWorkbook, availableDriversFilePath);

        // Add the driver and passenger to the "drivers with trips" list
        let driversWithTrips = [];
        try {
            const driversWithTripsWorkbook = xlsx.readFile(driversWithTripsFilePath);
            const driversWithTripsSheet = driversWithTripsWorkbook.Sheets[driversWithTripsWorkbook.SheetNames[0]];
            driversWithTrips = xlsx.utils.sheet_to_json(driversWithTripsSheet);
        } catch (error) {
            console.log("Drivers with trips file not found, creating a new one.");
        }

        // Create a new entry with both driver and passenger information
        const tripInfo = {
            driverCode: driver.uniqueCode,
            driverName: driver.Name,
            driverPhone: driver.Phone,
            passengerId: passenger.ID,
            passengerName: passenger.Name,
            passengerPickup: passenger.Pickup,
            passengerDestination: passenger.Destination,
            progress: "In progress"
        };

        driversWithTrips.push(tripInfo);

        // Write the updated "drivers with trips" list back to the Excel file
        const updatedTripsSheet = xlsx.utils.json_to_sheet(driversWithTrips);
        const updatedTripsWorkbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(updatedTripsWorkbook, updatedTripsSheet, "DriversWithTrips");
        xlsx.writeFile(updatedTripsWorkbook, driversWithTripsFilePath);

        return { success: true, message: "Driver and passenger moved to in-progress trips." };
    } catch (error) {
        console.error("Error processing driver trip:", error);
        return { success: false, message: "Internal server error." };
    }
};

// Route to handle trip acceptance by the driver
app.post("/accept-trip", (req, res) => {
    const { driverCode, passengerId } = req.body;

    if (!driverCode || !passengerId) {
        return res.status(400).json({ success: false, message: "Driver code and passenger ID are required." });
    }

    // Check if the driver already accepted a trip
    if (selectedPassengerId !== null) {
        return res.status(400).json({ success: false, message: "You can only accept one trip at a time." });
    }

    // Simulate accepting the trip
    selectedPassengerId = passengerId;

    // Move driver to in-progress list
    const result = moveDriverToInProgress(driverCode, passengerId);

    if (result.success) {
        console.log(`Driver with code "${driverCode}" accepted trip for passenger ID ${passengerId}`);
        res.status(200).json({ success: true, message: result.message });
    } else {
        res.status(500).json({ success: false, message: result.message });
    }
});
// Route to finish a trip
app.post("/finish-trip", (req, res) => {
    const { driverCode } = req.body;

    if (!driverCode) {
        return res.status(400).json({ success: false, message: "Driver code is required." });
    }

    const result = finishTrip(driverCode);

    if (result.success) {
        res.status(200).json({ success: true, message: result.message });
    } else {
        res.status(500).json({ success: false, message: result.message });
    }
});


// Function to finish the trip and update local drivers list
const finishTrip = (driverCode) => {
    const driversWithTripsFilePath = path.join(__dirname, "localDrivers_drivers_with_trips.xlsx");
    const availableDriversFilePath = path.join(__dirname, "localDrivers_available_drivers.xlsx");
    const availablePassengersFilePath = path.join(__dirname, "localDrivers_availablepassengers.xlsx");
    const localDriversFilePath = path.join(__dirname, "local_drivers.xlsx");

    try {
        // Load the "drivers with trips" list
        let driversWithTrips = [];
        const driversWithTripsWorkbook = xlsx.readFile(driversWithTripsFilePath);
        const driversWithTripsSheet = driversWithTripsWorkbook.Sheets[driversWithTripsWorkbook.SheetNames[0]];
        driversWithTrips = xlsx.utils.sheet_to_json(driversWithTripsSheet);

        // Find the driver in the "drivers with trips" list
        const driverIndex = driversWithTrips.findIndex(driver => driver.driverCode === driverCode);

        if (driverIndex === -1) {
            return { success: false, message: "Driver not found in drivers with trips list." };
        }

        // Extract driver and passenger information
        const tripInfo = driversWithTrips[driverIndex];
        const passengerId = tripInfo.passengerId; // Retrieve passenger ID from the trip details
        const driverInfo = {
            uniqueCode: tripInfo.driverCode,
        };

        // Add the driver to the "available drivers" list
        let availableDrivers = [];
        try {
            const availableDriversWorkbook = xlsx.readFile(availableDriversFilePath);
            const availableDriversSheet = availableDriversWorkbook.Sheets[availableDriversWorkbook.SheetNames[0]];
            availableDrivers = xlsx.utils.sheet_to_json(availableDriversSheet);
        } catch (error) {
            console.log("Available drivers file not found, creating a new one.");
        }

        // Add the driver to the available drivers list
        availableDrivers.push(driverInfo);

        // Write the updated "available drivers" list back
        const updatedAvailableDriversSheet = xlsx.utils.json_to_sheet(availableDrivers);
        const updatedAvailableDriversWorkbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(updatedAvailableDriversWorkbook, updatedAvailableDriversSheet, "AvailableDrivers");
        xlsx.writeFile(updatedAvailableDriversWorkbook, availableDriversFilePath);

        // Update the progress in the "drivers with trips" list
        driversWithTrips[driverIndex].progress = "Done";

        // Write the updated "drivers with trips" list back
        const updatedDriversWithTripsSheet = xlsx.utils.json_to_sheet(driversWithTrips);
        const updatedDriversWithTripsWorkbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(updatedDriversWithTripsWorkbook, updatedDriversWithTripsSheet, "DriversWithTrips");
        xlsx.writeFile(updatedDriversWithTripsWorkbook, driversWithTripsFilePath);

        // Remove the passenger from the "available passengers" list
        let availablePassengers = [];
        try {
            const availablePassengersWorkbook = xlsx.readFile(availablePassengersFilePath);
            const availablePassengersSheet = availablePassengersWorkbook.Sheets[availablePassengersWorkbook.SheetNames[0]];
            availablePassengers = xlsx.utils.sheet_to_json(availablePassengersSheet);
        } catch (error) {
            console.log("Available passengers file not found.");
        }

        // Find and remove the passenger by ID
        const passengerIndex = availablePassengers.findIndex(passenger => passenger.ID === passengerId);
        if (passengerIndex !== -1) {
            availablePassengers.splice(passengerIndex, 1);

            // Write the updated "available passengers" list back
            const updatedAvailablePassengersSheet = xlsx.utils.json_to_sheet(availablePassengers);
            const updatedAvailablePassengersWorkbook = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(updatedAvailablePassengersWorkbook, updatedAvailablePassengersSheet, "AvailablePassengers");
            xlsx.writeFile(updatedAvailablePassengersWorkbook, availablePassengersFilePath);
        }

        // Update the driver's trip count in the "local drivers" list
        let localDrivers = [];
        try {
            const localDriversWorkbook = xlsx.readFile(localDriversFilePath);
            const localDriversSheet = localDriversWorkbook.Sheets[localDriversWorkbook.SheetNames[0]];
            localDrivers = xlsx.utils.sheet_to_json(localDriversSheet);
        } catch (error) {
            console.log("Local drivers file not found, creating a new one.");
        }

        // Update trip count for the driver
        const localDriverIndex = localDrivers.findIndex(driver => driver.driverCode === driverCode);
        if (localDriverIndex !== -1) {
            localDrivers[localDriverIndex].TripsCompleted = (localDrivers[localDriverIndex].TripsCompleted || 0) + 1;
        } else {
            // If the driver is not found, add them to the list with the updated trip count
            localDrivers.push({ ...driverInfo, TripsCompleted: 1 });
        }

        // Write the updated "local drivers" list back
        const updatedLocalDriversSheet = xlsx.utils.json_to_sheet(localDrivers);
        const updatedLocalDriversWorkbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(updatedLocalDriversWorkbook, updatedLocalDriversSheet, "LocalDrivers");
        xlsx.writeFile(updatedLocalDriversWorkbook, localDriversFilePath);

        return { success: true, message: "Trip completed successfully. Data updated." };
    } catch (error) {
        console.error("Error processing completed trip:", error);
        return { success: false, message: "Internal server error." };
    }
};


// Route to verify the driver code
app.post("/verify-driver-code", (req, res) => {
    const { driverCode } = req.body;

    if (!driverCode) {
        return res.status(400).json({ success: false, message: "Driver code is required." });
    }

    // Check if the driver code exists in the "drivers with trips" list
    const result = verifyDriverCode(driverCode);

    if (result.success) {
        res.status(200).json({ success: true, message: "Driver code verified." });
    } else {
        res.status(404).json({ success: false, message: result.message });
    }
});

// Function to verify driver code in the "drivers with trips" list
const verifyDriverCode1 = (driverCode) => {
    const driversWithTripsFilePath = path.join(__dirname, "localDrivers_drivers_with_trips.xlsx");

    try {
        // Initialize drivers with trips list
        let driversWithTrips = [];

        // Check if the "drivers with trips" file exists
        if (fs.existsSync(driversWithTripsFilePath)) {
            const driversWithTripsWorkbook = xlsx.readFile(driversWithTripsFilePath);
            const driversWithTripsSheet = driversWithTripsWorkbook.Sheets[driversWithTripsWorkbook.SheetNames[0]];
            driversWithTrips = xlsx.utils.sheet_to_json(driversWithTripsSheet);
        } else {
            return { success: false, status: 404, message: "Drivers with trips list not found." };
        }

        // Search for the driver in the list
        const driver = driversWithTrips.find(driver => driver.driverCode === driverCode);

        if (!driver) {
            return { success: false, status: 404, message: "Driver code not found in the active trips list." };
        }

        // Return success if driver is found
        return { success: true, driver };
    } catch (error) {
        console.error("Error verifying driver code:", error);
        return { success: false, message: "Internal server error." };
    }
};
// Route to handle "Out of Work" functionality
app.post("/out-of-work", (req, res) => {
    const { driverCode } = req.body;

    if (!driverCode) {
        return res.status(400).json({ success: false, message: "Driver code is required." });
    }

    const availableDriversFilePath = path.join(__dirname, "localDrivers_available_drivers.xlsx");

    try {
        // Read available drivers list
        let availableDrivers = [];
        const availableDriversWorkbook = xlsx.readFile(availableDriversFilePath);
        const availableDriversSheet = availableDriversWorkbook.Sheets[availableDriversWorkbook.SheetNames[0]];
        availableDrivers = xlsx.utils.sheet_to_json(availableDriversSheet);

        // Find and remove the driver from the available drivers list
        const driverIndex = availableDrivers.findIndex(driver => driver.uniqueCode === driverCode);

        if (driverIndex !== -1) {
            availableDrivers.splice(driverIndex, 1);

            // Write the updated available drivers list back to the Excel file
            const updatedAvailableDriversSheet = xlsx.utils.json_to_sheet(availableDrivers);
            const updatedAvailableDriversWorkbook = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(updatedAvailableDriversWorkbook, updatedAvailableDriversSheet, "AvailableDrivers");
            xlsx.writeFile(updatedAvailableDriversWorkbook, availableDriversFilePath);

            res.status(200).json({ success: true, message: "Driver marked as out of work." });
        } else {
            res.status(404).json({ success: false, message: "Driver not found in available list." });
        }
    } catch (error) {
        console.error("Error processing out of work:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
});

/* !!!   Bicycle Rental   !!! */
app.get('/read-csv', (req, res) => {
    const inputFilePath = path.resolve(__dirname, 'bicycles.csv');
    const outputFilePath = path.resolve(__dirname, 'bicycles.csv');
    const bicycles = []; // Clear the bicycles array before reading the new file
    fs.createReadStream(inputFilePath)
        .pipe(csvParser())
        .on('data', (row) => {
            const bicycle = {
                id: row['ID'],
                available: row['AVAILABLE'] === 'true',
                endtime: row['RETURN_TIME'],
                s_name: row['name'],
                s_id: row['studentid'],
                s_email: row['studentemail']
            };
            bicycles.push(bicycle);
        })
        .on('end', () => {
            res.json(bicycles); // Send the parsed bicycles to the client
        })
        .on('error', (error) => {
            console.error('Error reading CSV:', error);
            res.status(500).send('Error reading CSV file');
        });
});

// Endpoint to check availability and update bicycle status
app.get('/update-time', (req, res) => {
    const inputFilePath = path.resolve(__dirname, 'bicycles.csv');
    const outputFilePath = path.resolve(__dirname, 'bicycles.csv');
    const now = new Date();
    const updatedRows = [];

    fs.createReadStream(inputFilePath)
        .pipe(csvParser())
        .on('data', (row) => {
            const endTime = new Date(row['RETURN_TIME']);
            if (isNaN(endTime.getTime()) || now > endTime) {
                row['AVAILABLE'] = 'true';  // Mark as available if the bike is overdue
                row['RETURN_TIME'] = '';  // Clear the return time
                row['name'] = '';  // Clear student name
                row['studentid'] = '';  // Clear student ID
                row['studentemail'] = '';  // Clear student email
            }
            updatedRows.push(row);
        })
        .on('end', () => {
            const headers = ['ID', 'AVAILABLE', 'RETURN_TIME', 'name', 'studentid', 'studentemail'];
            writeToPath(outputFilePath, updatedRows, { headers })
                .on('finish', () => {
                    res.json({ message: 'Bicycle statuses updated successfully!' });
                })
                .on('error', (err) => {
                    console.error('Error writing to CSV:', err);
                    res.status(500).json({ message: 'Failed to write updated data to the file.' });
                });
        })
        .on('error', (err) => {
            console.error('Error reading CSV:', err);
            res.status(500).json({ message: 'Failed to read the CSV file.' });
        });
});

// Rent a bicycle
app.post('/rent-bicycle', (req, res) => {
    try {
        const inputFilePath = path.resolve(__dirname, 'bicycles.csv');
        const outputFilePath = path.resolve(__dirname, 'bicycles.csv');
        const { bikeID, rentTime, sname, sid, semail } = req.body;

        // Validate required fields
        if (!bikeID || !rentTime || !sname || !sid || !semail) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const updatedRows = [];
        const rentDate = new Date(Date.now() + rentTime * 60 * 60 * 1000);

        fs.createReadStream(inputFilePath)
            .pipe(csvParser())
            .on('data', (row) => {
                if (row['ID'] == bikeID) {
                    row['RETURN_TIME'] = rentDate.toISOString();
                    row['AVAILABLE'] = 'false';
                    row['name'] = sname;
                    row['studentid'] = parseInt(sid, 10);
                    row['studentemail'] = semail;
                }
                updatedRows.push(row);
            })
            .on('end', () => {
                const headers = ['ID', 'AVAILABLE', 'RETURN_TIME', 'name', 'studentid', 'studentemail'];

                writeToPath(outputFilePath, updatedRows, { headers })
                    .on('finish', () => {
                        res.json({
                            message: `Success! You have rented Bicycle #${bikeID} for ${rentTime} hours.`
                        });
                    })
                    .on('error', (err) => {
                        console.error('Error writing to CSV:', err);
                        res.status(500).json({ message: 'Failed to write updated data to the file.' });
                    });
            })
            .on('error', (error) => {
                console.error('Error reading CSV:', error);
                res.status(500).json({ message: 'Error processing the CSV file.' });
            });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ message: 'Server error occurred.', details: error.message });
    }
});

// Start the server
const PORT = 4000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
