const NaiveCreditorProxy = artifacts.require("./NaiveCreditorProxy.sol");
const LTVCreditorProxy = artifacts.require("./LTVCreditorProxy.sol");

module.exports = function(deployer) {
    const contractRegistry = "0x10512440113cb6cb613be403135876d2e0a42c0b";

    deployer.deploy(
        NaiveCreditorProxy,
        contractRegistry,
    );

    deployer.deploy(LTVCreditorProxy);
};
