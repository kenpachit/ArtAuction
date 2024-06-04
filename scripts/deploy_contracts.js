const Web3 = require('web3');
const solc = require('solc');
const fs = require('fs');
require('dotenv').config();

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURA_URL));

const contractPath = './ArtAuction.sol';
const source = fs.readFileSync(contractPath, 'utf8');

const input = {
  language: 'Solidity',
  sources: {
    'ArtAuction.sol': {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['*'],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

const contractFile = output.contracts['ArtAuction.sol']['ArtAuction'];
const abi = contractFile.abi;
const bytecode = contractFile.evm.bytecode.object;

const contract = new web3.eth.Contract(abi);

const deployContract = async () => {
  try {
    const accounts = await web3.eth.getAccounts();

    const result = await contract
      .deploy({
        data: bytecode,
      })
      .send({
        from: accounts[0],
        gas: '4700000',
      });

    console.log('Contract deployed to:', result.options.address);

    const isCodePresent = await web3.eth.getCode(result.options.address);
    console.log('Contract functioning:', isCodePresent !== '0x');
  } catch (error) {
    console.error('Deployment failed:', error);
  }
};

deployPlatform().then(() => process.exit());