const addressBook = require("dharma-address-book");

const env = process.env.NETWORK || "development";

const addresses = addressBook.latest[env];

const dharmaMultisigAddress = addresses.DharmaMultiSigWallet;

const NaiveCreditorProxy = artifacts.require("./NaiveCreditorProxy.sol");
const LTVCreditorProxy = artifacts.require("./LTVCreditorProxy.sol");
const DharmaMultiSigWallet = artifacts.require("DharmaMultiSigWallet");

module.exports = async function(deployer, network, accounts) {
    const CONTRACT_OWNER = accounts[0];

    console.log("transferring ownership to the multisig");

    // Deploy the multi-sig wallet, which will own each of the contracts.
    const wallet = await DharmaMultiSigWallet.deployed();
    const naiveProxy = await NaiveCreditorProxy.deployed();
    const ltvProxy = await LTVCreditorProxy.deployed();

    await naiveProxy.transferOwnership(dharmaMultisigAddress, { from: CONTRACT_OWNER });
    await ltvProxy.transferOwnership(dharmaMultisigAddress, { from: CONTRACT_OWNER });

    console.log("ownership has been transferred to the multisig");
};
