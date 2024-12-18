const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const xlsx = require("xlsx");
const fs = require("fs"); // Import fs module
const app = express();
const port = 4300;

// Middleware to serve static files (like CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());

// Helper function to read Excel file safely
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

// Helper function to write to Excel file
const writeExcelFile = (filePath, data) => {
    const sheet = xlsx.utils.json_to_sheet(data);
    const newWorkbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(newWorkbook, sheet, path.basename(filePath, '.xlsx'));
    xlsx.writeFile(newWorkbook, filePath);
};

// Route to serve the HTML file at the root URL
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "create-account.html"));
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
    const availableDrivers = readExcelFile("available_drivers.xlsx");

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
    writeExcelFile("available_drivers.xlsx", availableDrivers);

    res.status(200).json({ success: true, message: "Availability updated." });
});

// Route to cancel driver availability
app.post("/cancel-availability", (req, res) => {
    const { uniqueCode } = req.body;
    const filePath = path.join(__dirname, "localdrivers.xlsx");
    const availableDriversFilePath = path.join(__dirname, "available_drivers.xlsx");

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
    const filePath = path.join(__dirname, "availablepassengers.xlsx");

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

    const drivers = readExcelFile("available_drivers.xlsx"); // Read from the correct file
    const driverExists = drivers.find(driver => driver.uniqueCode === uniqueCode); // Match uniqueCode field

    if (driverExists) {
        res.json({ success: true, message: "Driver verified." });
    } else {
        res.status(404).json({ success: false, message: "Driver not found." });
    }
});


// Function to move driver from available list to drivers with trips
const moveDriverToInProgress = (driverCode, passengerId) => {
    const availableDriversFilePath = path.join(__dirname, "available_drivers.xlsx");
    const driversWithTripsFilePath = path.join(__dirname, "drivers_with_trips.xlsx");
    const availablePassengersFilePath = path.join(__dirname, "availablepassengers.xlsx");

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
    const driversWithTripsFilePath = path.join(__dirname, "drivers_with_trips.xlsx");
    const availableDriversFilePath = path.join(__dirname, "available_drivers.xlsx");
    const availablePassengersFilePath = path.join(__dirname, "availablepassengers.xlsx");
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
const verifyDriverCode = (driverCode) => {
    const driversWithTripsFilePath = path.join(__dirname, "drivers_with_trips.xlsx");

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

    const availableDriversFilePath = path.join(__dirname, "available_drivers.xlsx");

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


// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});