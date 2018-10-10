var NaiveCreditorProxy = artifacts.require("./NaiveCreditorProxy.sol");

module.exports = function(deployer) {
    deployer.deploy(NaiveCreditorProxy);
};
