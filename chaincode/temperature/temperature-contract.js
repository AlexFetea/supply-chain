'use strict';

const { Contract } = require('fabric-contract-api');

class TemperatureContract extends Contract {
    async initLedger(ctx) {
        console.log('Initializing ledger...');
        const shipments = [
            {
                shipmentId: 'SHIP001',
                maxTemperature: 20,
                status: 'IN_TRANSIT',
                temperatures: [],
                delivered: false,
                owner: 'LogisticsCorp', // New: Associate owner
                auditTrail: [],
                creationTimestamp: new Date().toISOString(), // New: Track creation time
            },
        ];

        for (const shipment of shipments) {
            const key = shipment.shipmentId;
            console.log(`Storing shipment with key: ${key}`);
            try {
                await ctx.stub.putState(key, Buffer.from(JSON.stringify(shipment)));
                console.log(`Successfully stored shipment with key: ${key}`);
            } catch (error) {
                console.error(`Error storing shipment with key: ${key}`, error);
            }
        }

        console.log('Ledger initialization complete.');
    }

    async getShipment(ctx, shipmentId) {
        console.log(`Fetching shipment with ID: ${shipmentId}`);
        const shipmentAsBytes = await ctx.stub.getState(shipmentId);

        if (!shipmentAsBytes || shipmentAsBytes.length === 0) {
            console.error(`Shipment ${shipmentId} does not exist`);
            throw new Error(`Shipment ${shipmentId} does not exist`);
        }

        console.log(`Fetched shipment data: ${shipmentAsBytes.toString()}`);
        return shipmentAsBytes.toString();
    }

    async recordTemperature(ctx, shipmentId, temperature) {
        console.log(`[RECORD_TEMP] Recording temperature for shipment: ${shipmentId}`);
        const shipmentAsBytes = await ctx.stub.getState(shipmentId);

        if (!shipmentAsBytes || shipmentAsBytes.length === 0) {
            console.error(`[RECORD_TEMP] Shipment ${shipmentId} does not exist`);
            throw new Error(`Shipment ${shipmentId} does not exist`);
        }

        const shipment = JSON.parse(shipmentAsBytes.toString());
        const temp = Number(temperature);
        shipment.temperatures.push(temp);
        console.log(`[RECORD_TEMP] Updated temperatures: ${shipment.temperatures}`);

        // Add an entry to the audit trail
        shipment.auditTrail.push({
            timestamp: new Date().toISOString(),
            action: 'Temperature Recorded',
            details: { temperature: temp },
        });

        if (Math.max(...shipment.temperatures) > shipment.maxTemperature) {
            shipment.status = 'FAILED';
            console.log(`[RECORD_TEMP] Shipment ${shipmentId} failed due to temperature violation`);
            shipment.auditTrail.push({
                timestamp: new Date().toISOString(),
                action: 'Temperature Violation',
                details: { maxTemperature: shipment.maxTemperature },
            });
        }

        await ctx.stub.putState(shipmentId, Buffer.from(JSON.stringify(shipment)));
        console.log(`[RECORD_TEMP] Updated shipment: ${JSON.stringify(shipment)}`);
    }

    async listAllKeys(ctx) {
        console.log('Listing all keys...');
        const iterator = await ctx.stub.getStateByRange('', '');
        const results = [];

        while (true) {
            const res = await iterator.next();
            if (res.value) {
                console.log(`Found key: ${res.value.key}`);
                results.push(res.value.key);
            }
            if (res.done) {
                console.log('Key iteration complete.');
                await iterator.close();
                break;
            }
        }

        console.log(`Keys found: ${JSON.stringify(results)}`);
        return JSON.stringify(results);
    }

    async markDelivered(ctx, shipmentId) {
        console.log(`[MARK_DELIVERED] Marking shipment ${shipmentId} as delivered...`);
        const shipmentAsBytes = await ctx.stub.getState(shipmentId);

        if (!shipmentAsBytes || shipmentAsBytes.length === 0) {
            console.error(`[MARK_DELIVERED] Shipment ${shipmentId} does not exist`);
            throw new Error(`Shipment ${shipmentId} does not exist`);
        }

        const shipment = JSON.parse(shipmentAsBytes.toString());
        if (shipment.status === 'FAILED') {
            console.error(`[MARK_DELIVERED] Cannot deliver shipment ${shipmentId} due to temperature violations.`);
            throw new Error(`Shipment ${shipmentId} cannot be delivered due to temperature violations.`);
        }

        shipment.status = 'DELIVERED';
        shipment.delivered = true;
        shipment.deliveryTimestamp = new Date().toISOString(); // New: Track delivery timestamp
        console.log(`[MARK_DELIVERED] Shipment ${shipmentId} marked as delivered.`);
        shipment.auditTrail.push({
            timestamp: shipment.deliveryTimestamp,
            action: 'Marked Delivered',
        });

        await ctx.stub.putState(shipmentId, Buffer.from(JSON.stringify(shipment)));
    }

    async getAverageTemperature(ctx, shipmentId) {
        console.log(`[GET_AVG_TEMP] Calculating average temperature for shipment: ${shipmentId}`);
        const shipmentAsBytes = await ctx.stub.getState(shipmentId);

        if (!shipmentAsBytes || shipmentAsBytes.length === 0) {
            console.error(`[GET_AVG_TEMP] Shipment ${shipmentId} does not exist`);
            throw new Error(`Shipment ${shipmentId} does not exist`);
        }

        const shipment = JSON.parse(shipmentAsBytes.toString());
        const avgTemp = shipment.temperatures.reduce((acc, val) => acc + val, 0) / shipment.temperatures.length || 0;
        console.log(`[GET_AVG_TEMP] Average temperature: ${avgTemp}`);
        return avgTemp;
    }

    async generateShipmentReport(ctx, shipmentId) {
        console.log(`[GENERATE_REPORT] Generating report for shipment: ${shipmentId}`);
        const shipmentAsBytes = await ctx.stub.getState(shipmentId);

        if (!shipmentAsBytes || shipmentAsBytes.length === 0) {
            console.error(`[GENERATE_REPORT] Shipment ${shipmentId} does not exist`);
            throw new Error(`Shipment ${shipmentId} does not exist`);
        }

        const shipment = JSON.parse(shipmentAsBytes.toString());
        const report = {
            shipmentId: shipment.shipmentId,
            status: shipment.status,
            temperatures: shipment.temperatures,
            averageTemperature: shipment.temperatures.reduce((acc, val) => acc + val, 0) / shipment.temperatures.length || 0,
            delivered: shipment.delivered,
            auditTrail: shipment.auditTrail,
            owner: shipment.owner,
        };

        console.log(`[GENERATE_REPORT] Report: ${JSON.stringify(report)}`);
        return JSON.stringify(report);
    }
}

module.exports = TemperatureContract;
