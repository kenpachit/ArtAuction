const Web3 = require('web3');
const solc = require('solc');
const fs = require('fs');
require('dotenv').config();

let web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURA_URL));
let auctionContractPath = './ArtAuction.sol';
let auctionSourceCode;
let compilationOutput;
let auctionContractMetaData;
let auctionAbi;
let auctionBytecode;
let auctionContract;

try {
    auctionSourceCode = fs.readFileSync(auctionContractPath, 'utf8');
} catch (error) {
    console.error("Error reading Solidity source file:", error);
    process.exit(1); // Exit if source file can't be read
}

try {
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

    compilationOutput = JSON.parse(solc.compile(JSON.stringify(compilerInput)));
    auctionContractMetaData = compilationOutput.contracts['ArtAuction.sol']['ArtAuction'];
    auctionAbi = auctionContractMetaData.abi;
    auctionBytecode = auctionContractMetaData.evm.bytecode.object;

    auctionContract = new web3.eth.Contract(auctionAbi);
} catch (error) {
    console.error("Compilation error:", error);
    process.exit(1); // Exit if there's a compilation error
}

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

    try {
        const deployedCode = await web3.eth.getCode(deploymentResult.options.address);
        console.log('Auction Contract functioning:', deployedCode !== '0x');
    } catch (error) {
        throw new Error(`Error verifying the deployment: ${error}`);
    }
    } catch (error) {
    console.error('Auction Contract deployment failed:', error);
    }
};

deployAuctionContract().then(() => process.exit());