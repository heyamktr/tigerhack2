class DriverInterface {
    constructor() {
      if (this.constructor === DriverInterface) {
        throw new Error("Cannot instantiate an interface directly.");
      }
    }
  
    get name() {
      throw new Error("Method 'get name()' must be implemented.");
    }
  
    set name(value) {
      throw new Error("Method 'set name()' must be implemented.");
    }
  
    get phoneNumber() {
      throw new Error("Method 'get phoneNumber()' must be implemented.");
    }
  
    set phoneNumber(value) {
      throw new Error("Method 'set phoneNumber()' must be implemented.");
    }
  
    get car() {
      throw new Error("Method 'get car()' must be implemented.");
    }
  
    set car(value) {
      throw new Error("Method 'set car()' must be implemented.");
    }
  
    get capacity() {
      throw new Error("Method 'get capacity()' must be implemented.");
    }
  
    set capacity(value) {
      throw new Error("Method 'set capacity()' must be implemented.");
    }
  
    get available() {
      throw new Error("Method 'get available()' must be implemented.");
    }
  
    set available(value) {
      throw new Error("Method 'set available()' must be implemented.");
    }
  
    display() {
      throw new Error("Method 'display()' must be implemented.");
    }
  }
  