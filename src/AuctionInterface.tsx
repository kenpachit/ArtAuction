import React, { useEffect, useState, useCallback } from 'react';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';

const CONTRACT_ABI: AbiItem[] = JSON.parse(process.env.REACT_APP_CONTRACT_ABI || '');
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

const AuctionInterface: React.FC = () => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [contract, setContract] = useState<any>(null);
  const [highestBid, setHighestBid] = useState<number>(0);
  const [artworkDetails, setArtworkDetails] = useState<string>('');
  const [bidAmount, setBidAmount] = useState<string>('0');

  useEffect(() => {
    const initWeb3 = async () => {
      if (web3 || !window.ethereum) {
        console.log('Web3 instance already initialized or Non-Ethereum browser detected.');
        return;
      }
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        const contractInstance = new web3Instance.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
        setContract(contractInstance);
      } catch (error) {
        console.error('Ethereum request failed:', error);
      }
    };
    initWeb3();
  }, [web3]);

  const fetchAuctionDetails = useCallback(() => {
    if (!contract) return;
    contract.methods.currentHighestBid().call()
      .then((result: number) => {
        setHighestBid(result);
      }).catch((error: any) => {
        console.error('Failed to fetch highest bid:', error);
      });

    contract.methods.artworkDetails().call()
      .then((result: string) => {
        setArtworkDetails(result);
      }).catch((error: any) => {
        console.error('Failed to fetch artwork details:', error);
      });
  }, [contract]);

  useEffect(() => {
    fetchAuctionDetails();
  }, [fetchAuctionDetails]);

  useEffect(() => {
    const newHighestBidListener = () => {
      fetchAuctionDetails();
    };

    if (contract) {
      contract.events.NewHighestBid({}, newHighestBidListener);
      return () => {
        contract.events.NewHighestBid().unsubscribe(newHighestBidListener);
      };
    }
  }, [contract, fetchAuctionDetails]);

  const submitBid = async () => {
    if (!web3 || !contract) {
      console.log('Web3 or contract not initialized');
      return;
    }
    const accounts = await web3.eth.getAccounts();
    const weiValue = web3.utils.toWei(bidAmount, 'ether');
    contract.methods.bid().send({ from: accounts[0], value: weiValue })
      .then(() => {
        console.log('Bid successfully submitted');
      })
      .catch((error: any) => {
        console.error('Bid submission failed:', error);
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
        placeholder="Bid Amount in ETH"
      />
      <button onClick={submitBid}>Submit Bid</button>
    </div>
  );
};

export default AuctionInterface;