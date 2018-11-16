const HDWalletProvider = require("truffle-hdwallet-provider");

module.exports = {
    networks: {
        development: {
            host: "localhost",
            port: 8545,
            network_id: "*", // Match any network id,
            gas: 6712390,
            gasPrice: 1,
        },
        kovan: {
            provider: () => new HDWalletProvider(
                process.env.WALLET_KEY, "https://kovan.infura.io/v3/" + process.env.INFURA_API_KEY
            ),
            network_id: "1",
            gas: 4000000,
            gasPrice: 22000000000, // 15 GWei, as per https://ethgasstation.info/
        },
        live: {
            provider: () => new HDWalletProvider(
                process.env.WALLET_KEY, "https://mainnet.infura.io/v3/" + process.env.INFURA_API_KEY
            ),
            network_id: "1",
            gas: 4000000,
            gasPrice: 22000000000, // 15 GWei, as per https://ethgasstation.info/
        },
    },
    test_directory: "test/js",
};
