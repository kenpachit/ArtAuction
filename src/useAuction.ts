import { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import AuctionContractABI from './AuctionContractABI.json';

const useAuction = () => {
  const web3Instance = new Web3(Web3.givenProvider || process.env.REACT_APP_INFURA_URL);
  const auctionContractAddr = process.env.REACT_APP_AUCTION_CONTRACT_ADDRESS;
  const auctionContract = new web3Instance.eth.Contract(AuctionContractABI, auctionContractAddr);

  const [userAccount, setUserAccount] = useState<string | null>(null);
  const [auctionDetails, setAuctionDetails] = useState<any>(null);
  const [isFetchingData, setIsFetchingData] = useState<boolean>(false);
  const [operationError, setOperationError] = useState<Error | null>(null);

  const connectWallet = useCallback(async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        return accounts[0];
      } catch (error) {
        setOperationError(error as Error);
        return null;
      }
    } else {
      setOperationError(new Error('Ethereum wallet is not available'));
      return null;
    }
  }, []);

  const handleConnectWallet = useCallback(async () => {
    const account = await connectWallet();
    if (account) setUserAccount(account);
  }, [connectWallet]);

  const retrieveAuctionDetails = useCallback(async () => {
    if (auctionContract) {
      setIsFetchingData(true);
      try {
        const data = await auctionContract.methods.getAuctionData().call();
        setAuctionDetails(data);
      } catch (error) {
        setOperationError(error as Error);
      } finally {
        setIsFetchingData(false);
      }
    }
  }, [auctionContract]);

  const placeBid = useCallback(async (bidAmountEther: number) => {
    if (userAccount && auctionContract) {
      const bidAmountWei = web3Instance.utils.toWei(bidAmountEther.toString(), 'ether');
      try {
        await auctionContract.methods.bid().send({ from: userAccount, value: bidAmountWei });
      } catch (error) {
        setOperationError(error as Error);
      }
    }
  }, [userAccount, auctionContract, web3Instance.utils]);

  useEffect(() => {
    const init = async () => {
      if (!userAccount) {
        await handleConnectWallet();
      }
      await retrieveAuctionDetails();
    };

    init();

    // Listen for BidPlaced event to refresh auction details
    const subscribeToBidPlacedEvent = () => {
      if (auctionContract) {
        const onBidPlaced = auctionContract.events.BidPlaced({
          filter: {}, fromBlock: 'latest'
        }, (error, event) => {
          if (error) {
            setOperationError(error);
          } else if (event) {
            retrieveAuctionDetails();
          }
        });

        return () => {
          if (onBidPlaced.unsubscribe) {
            onBidPlaced.unsubscribe();
          }
        };
      }
    };

    return subscribeToBidPlacedEvent();
  }, [userAccount, auctionContract, handleConnectWallet, retrieveAuctionDetails]);

  return {
    handleConnectWallet,
    auctionDetails,
    placeBid,
    isFetchingData,
    operationError
  };
};

export default useAuction;