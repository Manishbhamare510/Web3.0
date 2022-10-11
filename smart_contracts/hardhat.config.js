require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: "0.8.0",
  networks: {
    ropsten: {
      url: "https://eth-ropsten.alchemyapi.io/v2/JPtB-NA7uJA705Prnm14T6568aygjg5m",
      accounts: [
        "f8158f94ea45510bfdb8367379343852d593673f874607a4629dd6a96af7b1c2",
      ],
    },
  },
};
