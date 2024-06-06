const Web3 = require('web3');
const solc = require('solc');
const fs = require('fs');
require('dotenv').config();

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURA_URL));

const auctionContractPath = './ArtAuction.sol';
const auctionSourceCode = fs.readFileSync(auctionContractPath, 'utf8');

const compilerInput = {
  language: 'Solidity',
  sources: {
    'ArtAuction.sol': {
      content: auctionSourceCode,
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

const compilationOutput = JSON.parse(solc.compile(JSON.stringify(compilerInput)));

const auctionContractMetaData = compilationOutput.contracts['ArtAuction.sol']['ArtAuction'];
const auctionAbi = auctionContractMetaData.abi;
const auctionBytecode = auctionContractMetaData.evm.bytecode.object;

const auctionContract = new web3.eth.Contract(auctionAbi);

const deployAuctionContract = async () => {
  try {
    const ethAccounts = await web3.eth.getAccounts();

    const deploymentResult = await auctionContract
      .deploy({
        data: auctionBytecode,
      })
      .send({
        from: ethAccounts[0],
        gas: '4700000',
      });

    console.log('Auction Contract deployed to:', deploymentResult.options.address);

    const deployedCode = await web3.eth.getCode(deploymentResult.options.address);
    console.log('Auction Contract functioning:', deployedCode !== '0x');
  } catch (error) {
    console.error('Auction Contract deployment failed:', error);
  }
};

deployAuctionContract().then(() => process.exit());