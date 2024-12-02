# Supply Chain Temperature Tracking

This project provides a temperature tracking solution for the supply chain, implemented using Hyperledger Fabric.

## Prerequisites

Ensure the following software is installed on your system:

1. **Docker**
2. **Node.js**
3. **Hyperledger Fabric**

## Setup Instructions

### 1. Clone the Repositories

1. Clone the supply chain repository:

```bash
cd supply-chain/chaincode/temperature
```

2. Navigate to the chaincode directory:

```bash
git clone https://github.com/AlexFetea/supply-chain.git
```

3. Install required Node.js packages:

```bash
npm install
```

4. In a separate directory, clone the Hyperledger Fabric samples repository:

```bash
git clone https://github.com/hyperledger/fabric-samples.git
```

### 2. Setup Hyperledger Fabric Environment

1. Navigate to the fabric-samples directory:

```bash
cd fabric-samples
```

2. Download the necessary Fabric binaries:

```bash
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.0
```

3. Update the environment variables:

```bash
export PATH=${PWD}/bin:$PATH
export FABRIC_CFG_PATH=${PWD}/config/
```
**More exports may be needed**

4. Create a channel:
```bash
./network.sh up createChannel -c mychannel -ca
```

### 4.  Deploy the Chaincode

1. Deploy the chaincode to the network:

```bash
./network.sh deployCC -ccn temperature -ccp PATH/TO/YOUR/CHAINCODE/REPO/chaincode/temperature -ccl javascript
```

Replace PATH/TO/YOUR/CHAINCODE/REPO with the absolute path to your cloned supply-chain repository.


### 5.  Initialize the Ledger
1. Set environment variables:
```bash
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
```

2. Invoke the initLedger function:

```bash
peer chaincode invoke -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
    -C mychannel -n temperature \
    --peerAddresses localhost:7051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
    --peerAddresses localhost:9051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
    -c '{"function":"initLedger","Args":[]}'

```

### 6.  Query the Chaincode

1. Query the ledger for all keys:

```bash
peer chaincode query -C mychannel -n temperature -c '{"function":"listAllKeys","Args":[]}'
```

Expected output:
```bash
['SHIP001']
```
