const addressBook = require("dharma-address-book");

const env = process.env.NODE_ENV || "development";

const addresses = addressBook.latest[env];

const contractRegistryAddress = addresses.ContractRegistry;

const NaiveCreditorProxy = artifacts.require("./NaiveCreditorProxy.sol");
const LTVCreditorProxy = artifacts.require("./LTVCreditorProxy.sol");

module.exports = function(deployer) {
    deployer.deploy(NaiveCreditorProxy, contractRegistryAddress);

    deployer.deploy(LTVCreditorProxy, contractRegistryAddress);
};
