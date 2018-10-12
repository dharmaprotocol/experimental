const NaiveCreditorProxy = artifacts.require("./NaiveCreditorProxy.sol");
const LTVCreditorProxy = artifacts.require("./LTVCreditorProxy.sol");

module.exports = function(deployer) {
    const contractRegistry = "0xbeedb1250c757b0687106a137630c06c10876316";

    deployer.deploy(
        NaiveCreditorProxy,
        contractRegistry,
    );

    deployer.deploy(LTVCreditorProxy);
};
