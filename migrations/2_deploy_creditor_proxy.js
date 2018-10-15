const addressBook = require("dharma-address-book");

// TODO: Update this to allow for kovan, etc.
const addresses = addressBook.latest.development;

const contractRegistryAddress = addresses.ContractRegistry;

const NaiveCreditorProxy = artifacts.require("./NaiveCreditorProxy.sol");
const LTVCreditorProxy = artifacts.require("./LTVCreditorProxy.sol");

module.exports = function(deployer) {
    deployer.deploy(NaiveCreditorProxy, contractRegistry);

    deployer.deploy(LTVCreditorProxy, contractRegistry);
};
