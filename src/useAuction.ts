import { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import AuctionContractABI from './AuctionContractABI.json';

const useAuction = () => {
  const web3 = new Web3(Web3.givenProvider || process.env.REACT_APP_INFURA_URL);
  const auctionContractAddress = process.env.REACT_APP_AUCTION_CONTRACT_ADDRESS;
  const auctionContract = new web3.eth.Contract(AuctionContractABI, auctionContractAddress);
  
  const [account, setAccount] = useState<string | null>(null);
  const [auctionData, setAuctionData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const connectWallet = useCallback(async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } catch (error) {
        setError(error as Error);
      }
    } else {
      setError(new Error('Ethereum wallet is not available'));
    }
  }, []);

  const fetchAuctionData = useCallback(async () => {
    if (auctionContract) {
      setLoadingData(true);
      try {
        const data = await auctionContract.methods.getAuctionData().call();
        setAuctionData(data);
      } catch (error) {
        setError(error as Error);
      } finally {
        setLoadingData(false);
      }
    }
  }, [auctionContract]);

  const submitBid = useCallback(async (amount: number) => {
    if (account && auctionContract) {
      const bidAmount = web3.utils.toWei(amount.toString(), 'ether');
      try {
        await auctionContract.methods.bid().send({ from: account, value: bidAmount });
      } catch (error) {
        setError(error as Error);
      }
    }
  }, [account, auctionContract, web3.utils]);

  useEffect(() => {
    if (auctionContract) {
      const bidEvent = auctionContract.events.BidPlaced({
        filter: {}, fromBlock: 'latest'
      }, (error, event) => {
        if (error) {
          setError(error);
        } else if (event) {
          fetchAuctionData();
        }
      });

      return () => {
        bidEvent.unsubscribe();
      };
    }
  }, [auctionContract, fetchAuctionData]);

  return { connectWallet, auctionData, submitBid, loadingData, error };
};

export default useAuction;