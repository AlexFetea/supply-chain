'use strict';

const shim = require('fabric-shim');
const TemperatureContract = require('./temperature-contract');

class ChaincodeWrapper {
    constructor() {
        this.contract = new TemperatureContract(); // Create the contract instance once
    }

    async Init(stub) {
        console.info('Init method called');
        this.ctx = { stub, clientIdentity: new shim.ClientIdentity(stub) }; // Initialize context
        if (this.contract.initLedger) {
            await this.contract.initLedger(this.ctx); // Call initLedger with the context
        }
        return shim.success();
    }

    async Invoke(stub) {
        console.info('Invoke method called');
        const { fcn, params } = stub.getFunctionAndParameters();
        console.info(`Invoking function: ${fcn} with params: ${params}`);

        // Use consistent context
        this.ctx = { stub, clientIdentity: new shim.ClientIdentity(stub) };

        if (typeof this.contract[fcn] !== 'function') {
            console.error(`No function named ${fcn} found in contract`);
            return shim.error(new Error(`No function named ${fcn} found in contract`));
        }

        try {
            const result = await this.contract[fcn](this.ctx, ...params); // Call the function dynamically
            console.info(`Function ${fcn} executed successfully`);

            if (result instanceof Buffer) {
                return shim.success(result); // Return result if it is a Buffer
            }

            return shim.success(Buffer.from(JSON.stringify(result || {}))); // Return JSON-stringified result
        } catch (err) {
            console.error(`Error executing function ${fcn}: ${err}`);
            return shim.error(err);
        }
    }
}

shim.start(new ChaincodeWrapper());
