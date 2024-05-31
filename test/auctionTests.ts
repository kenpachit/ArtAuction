import { assert } from 'chai';
import { ethers } from 'hardhat';
import { Contract, Signer } from 'ethers';
import { render, fireEvent, waitFor } from '@testing-library/react';
import AuctionComponent from '../components/AuctionComponent';
import dotenv from 'dotenv';

dotenv.config();

describe('Auction Contract and Component Tests', function () {
  let auction: Contract;
  let deployer: Signer;
  let participant: Signer;
  let anotherParticipant: Signer;

  before(async function () {
    [deployer, participant, anotherParticipant] = await ethers.getSigners();

    const AuctionFactory = await ethers.getContractFactory('Auction');
    auction = await AuctionFactory.deploy();
  });

  describe('Solidity Auction Contract', function () {
    it('Allows deployment and starts in a non-ended state', async function () {
      assert.isFalse(await auction.hasEnded(), 'Auction should not be ended immediately after deployment');
    });

    it('Allows bids and tracks the highest bidder', async function () {
      const bidAmount = ethers.utils.parseEther('1');
      await auction.connect(participant).placeBid({ value: bidAmount });

      const highestBidder = await auction.highestBidder();
      assert.equal(await participant.getAddress(), highestBidder, 'Participant should be the highest bidder');
    });

    it('Rejects bids lower than the highest bid', async function () {
      const lowBidAmount = ethers.utils.parseEther('0.5');
      try {
        await auction.connect(anotherParticipant).placeBid({ value: lowBidAmount });
        assert.fail('Bid should have been rejected');
      } catch (error) {
        assert.include(error.message, 'Bid too low', 'Should reject low bids');
      }
    });
  });

  describe('React Auction Component', function () {
    it('Renders and displays initial state correctly', async () => {
      const { getByText } = render(<AuctionComponent contract={auction} account={await deployer.getAddress()} />);
      await waitFor(() => {
        assert.exists(getByText(/Current highest bid:/), 'Should display the text for current highest bid');
      });
    });

    it('Updates UI after placing a bid', async () => {
      const bidAmount = '1';
      const { getByText, getByTestId } = render(<AuctionComponent contract={auction} account={await participant.getAddress()} />);
      fireEvent.change(getByTestId('bid-input'), { target: { value: bidAmount } });
      fireEvent.click(getByTestId('bid-button'));

      await waitFor(() => {
        assert.exists(getByText(new RegExp(`Highest bid is now ${bidAmount} ETH`)), 'UI should update the highest bid');
      });
    });
  });
});