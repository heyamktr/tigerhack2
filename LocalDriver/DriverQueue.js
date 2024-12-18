
class DriverQueue {
    constructor() {
        this.driverList = []; // Internal list to store LocalDriver objects
    }

    // Add a driver to the queue
    addDriver(driver) {
        if (driver instanceof LocalDriver) {
            this.driverList.push(driver);
            console.log(`Driver ${driver.getName()} has been added to the queue.`);
        } else {
            console.error("Invalid driver. Must be an instance of LocalDriver.");
        }
    }

    // Remove a driver from the queue by their name
    removeDriver(name) {
        const index = this.driverList.findIndex(driver => driver.getName() === name);
        if (index !== -1) {
            const removedDriver = this.driverList.splice(index, 1)[0];
            console.log(`Driver ${removedDriver.getName()} has been removed from the queue.`);
            return removedDriver;
        } else {
            console.log(`Driver with name ${name} not found in the queue.`);
            return null;
        }
    }

    // List all drivers in the queue
    listDrivers() {
        const driverListDiv = document.getElementById("driver-list");
        driverListDiv.innerHTML = ''; // Clear previous content
        if (this.driverList.length > 0) {
            this.driverList.forEach(driver => {
                driverListDiv.innerHTML += driver.displayDriver(); // Display each driver in HTML format
            });
        } else {
            driverListDiv.innerHTML = "<p>No drivers available.</p>";
        }
    }

    // Check the availability of a specific driver by name
    checkAvailability(name) {
        const driver = this.driverList.find(driver => driver.getName() === name);
        return driver ? driver.getAvailability() : null;
    }
}

