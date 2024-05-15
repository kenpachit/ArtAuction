import React, { useEffect, useState, useCallback } from 'react';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';

const CONTRACT_ABI: AbiItem[] = JSON.parse(process.env.REACT_APP_CONTRACT_ABI || '');
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

const AuctionInterface: React.FC = () => {
  const [web3Instance, setWeb3Instance] = useState<Web3 | null>(null);
  const [auctionContract, setAuctionContract] = useState<any>(null);
  const [highestBid, setHighestBid] = useState<number>(0);
  const [artworkDetails, setArtworkDetails] = useState<string>('');
  const [bidAmount, setBidAmount] = useState<string>('0');

  useEffect(() => {
    const initializeWeb3AndContract = async () => {
      if (web3Instance || !window.ethereum) {
        console.log('Web3 instance already initialized or Non-Ethereum browser detected.');
        return;
      }
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3 = new Web3(window.ethereum);
        setWeb3Instance(web3);
        const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
        setAuctionContract(contract);
      } catch (error) {
        console.error('Ethereum request failed:', error);
      }
    };
    initializeWeb3AndContract();
  }, [web3Instance]);

  const loadAuctionData = useCallback(() => {
    if (!auctionContract) return;
    auctionContract.methods.currentHighestBid().call()
      .then((result: number) => {
        setHighestBid(result);
      }).catch((error: any) => {
        console.error('Failed to fetch highest bid:', error);
      });

    auctionContract.methods.artworkDetails().call()
      .then((result: string) => {
        setArtworkDetails(result);
      }).catch((error: any) => {
        console.error('Failed to fetch artwork details:', error);
      });
  }, [auctionContract]);

  useEffect(() => {
    loadAuctionData();
  }, [loadAuctionData]);

  useEffect(() => {
    const updateOnNewHighestBid = () => {
      loadAuctionData();
    };

    if (auctionContract) {
      auctionContract.events.NewHighestBid({}, updateOnNewHighestBid);
      return () => {
        auctionContract.events.NewHighestBid().unsubscribe(updateOnNewHighestBid);
      };
    }
  }, [auctionContract, loadAuctionData]);

  const placeBid = async () => {
    if (!web3Instance || !auctionContract) {
      console.log('Web3 or contract not initialized');
      return;
    }
    const accounts = await web3Instance.eth.getAccounts();
    const weiValue = web3Instance.utils.toWei(bidAmount, 'ether');
    auctionContract.methods.bid().send({ from: accounts[0], value: weiValue })
      .then(() => {
        console.log('Bid successfully placed');
      })
      .catch((error: any) => {
        console.error('Bid placement failed:', error);
      });
  };

  return (
    <div>
      <h1>Auction Interface</h1>
      <p>{artworkDetails}</p>
      <p>Current Highest Bid: {highestBid} ETH</p>
      <input
        type="number"
        value={bidAmount}
        onChange={(e) => setBidAmount(e.target.value)}
        placeholder="Enter Bid Amount in ETH"
      />
      <button onClick={placeBid}>Place Bid</button>
    </div>
  );
};

export default AuctionInterface;