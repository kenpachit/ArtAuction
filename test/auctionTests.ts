import { assert } from 'chai';
import { ethers } from 'hardhat';
import { Contract, Signer } from 'ethers';
import { render, fireEvent, waitFor } from '@testing-library/react';
import AuctionComponent from '../components/AuctionComponent';
import dotenv from 'dotenv';

dotenv.config();

describe('Auction Contract and Component Tests', function () {
  let auction: Contract;                   // Smart contract instance for the auction
  let deployer: Signer;                    // Account deploying the contract
  let participant: Signer;                 // A participant in the auction
  let anotherParticipant: Signer;          // Another participant in the auction

  // Set up before the tests run
  before(async function () {
    // Get signers from ethers
    [deployer, participant, anotherParticipant] = await ethers.getSigners();

    // Deploy the Auction contract
    const AuctionFactory = await ethers.getContractFactory('Auction');
    auction = await AuctionFactory.deploy(/* constructor arguments */);
  });

  // Group tests related to the Solidity smart contract
  describe('Solidity Auction Contract', function () {
    it('Allows deployment and starts in a non-ended state', async function () {
      // Verify auction is not ended after deployment
      assert.isFalse(await auction.hasEnded(), 'Auction should not be ended immediately after deployment');
    });

    it('Allows bids and tracks the highest bidder', async function () {
      // Participant places a bid
      const bidAmount = ethers.utils.parseEther('1');
      await auction.connect(participant).placeBid({ value: bidAmount });

      // Verify participant is now the highest bidder
      const highestBidder = await auction.highestBidder();
      assert.equal(await participant.getAddress(), highestBidder, 'Participant should be the highest bidder');
    });

    it('Rejects bids lower than the highest bid', async function () {
      // Attempt to place a lower bid
      const lowBidAmount = ethers.utils.parseEther('0.5');
      try {
        await auction.connect(anotherParticipant).placeBid({ value: lowBidAmount });
        assert.fail('Bid should have been rejected');
      } catch (error) {
        // Verify bid was rejected for being too low
        assert.include(error.message, 'Bid too low', 'Should reject low bids');
      }
    });
  });

  // Group tests related to the React component
  describe('React Auction Component', function () {
    it('Renders and displays initial state correctly', async () => {
      const { getByText } = render(<AuctionComponent contract={auction} account={await deployer.getAddress()} />);
      await waitFor(() => {
        // Verify initial UI state
        assert.exists(getByText(/Current highest bid:/), 'Should display the text for current highest bid');
      });
    });

    it('Updates UI after placing a bid', async () => {
      // Interact with the component to place a bid
      const bidAmount = '1';
      const { getByText, getByTestId } = render(<AuctionComponent contract={auction} account={await participant.getAddress()} />);
      fireEvent.change(getByTestId('bid-input'), { target: { value: bidAmount } });
      fireEvent.click(getByTestId('bid-button'));

      await waitFor(() => {
        // Verify UI updates to reflect the new highest bid
        assert.exists(getByText(new RegExp(`Highest bid is now ${bidAmount} ETH`)), 'UI should update the highest bid');
      });
    });
  });
});