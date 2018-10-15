const NaiveCreditorProxy = artifacts.require("./NaiveCreditorProxy.sol");
const LTVCreditorProxy = artifacts.require("./LTVCreditorProxy.sol");

module.exports = function(deployer) {
    const contractRegistry = "0x3a943351745db0cadbedef212e1211af99495af6";

    deployer.deploy(
        NaiveCreditorProxy,
        contractRegistry,
    );

    deployer.deploy(LTVCreditorProxy);
};
