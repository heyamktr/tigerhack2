
class DriverController {
    constructor(driverQueue) {
        this.driverQueue = driverQueue; // The DriverQueue instance
        this.setupForm();
    }

    // Set up form event listener for adding drivers
    setupForm() {
        const form = document.getElementById("driver-form");
        form.addEventListener("submit", (event) => this.handleFormSubmit(event));
    }

    // Handle the form submission
    handleFormSubmit(event) {
        event.preventDefault(); // Prevent default form behavior (page reload)
        
        // Get the form values
        const name = document.getElementById("driverName").value;
        const phone = document.getElementById("phoneNumber").value;
        const car = document.getElementById("car").value;
        const capacity = parseInt(document.getElementById("capacity").value);
        const available = document.getElementById("available").checked; // Assuming there's a checkbox for availability

        // Create a new driver object
        const newDriver = new LocalDriver(name, phone, car, capacity, available);

        // Add the new driver to the queue
        this.driverQueue.addDriver(newDriver);

        // Save the drivers list to localStorage
        this.saveDriversToLocalStorage();

        // Update the displayed driver list
        this.driverQueue.listDrivers();

        // Clear the form
        document.getElementById("driver-form").reset();
    }

    // Load drivers from localStorage and add them to the DriverQueue
    loadDriversFromLocalStorage() {
        const storedDrivers = JSON.parse(localStorage.getItem("driversList")) || [];
        storedDrivers.forEach(driverData => {
            const driver = new LocalDriver(
                driverData.name,
                driverData.phoneNumber,
                driverData.car,
                driverData.capacity,
                driverData.available
            );
            this.driverQueue.addDriver(driver);
        });
    }

    // Save drivers to localStorage
    saveDriversToLocalStorage() {
        const driversList = this.driverQueue.driverList.map(driver => ({
            name: driver.getName(),
            phoneNumber: driver.getPhoneNumber(),
            car: driver.getCar(),
            capacity: driver.getCapacity(),
            available: driver.getAvailability()
        }));
        localStorage.setItem("driversList", JSON.stringify(driversList));
    }

    // Remove a driver by name
    removeDriver(name) {
        const removedDriver = this.driverQueue.removeDriver(name);
        if (removedDriver) {
            this.saveDriversToLocalStorage();
            this.driverQueue.listDrivers();
        }
    }
}
