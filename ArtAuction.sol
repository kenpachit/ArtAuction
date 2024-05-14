pragma solidity ^0.8.0;

contract ArtAuction {
    address payable public sellerAddress;
    uint public auctionEndTimeStamp;

    address public highestBidderAddress;
    uint public highestBidAmount;
    
    mapping(address => uint) private bidsToRefund;

    bool private auctionHasEnded;

    event NewHighestBid(address indexed bidder, uint amount);
    event AuctionConcluded(address winner, uint amount);

    constructor(uint biddingDuration, address payable seller) {
        sellerAddress = seller;
        auctionEndTimeStamp = block.timestamp + biddingDuration;
    }

    function placeBid() external payable {
        require(block.timestamp <= auctionEndTimeStamp, "Auction already ended.");
        require(msg.value > highestBidAmount, "Existing higher bid.");

        if (highestBidAmount != 0) {
            bidsToRefund[highestBidderAddress] += highestBidAmount;
        }

        highestBidderAddress = msg.sender;
        highestBidAmount = msg.value;

        emit NewHighestBid(msg.sender, msg.value);
    }

    function withdrawBid() external returns (bool success) {
        uint refundAmount = bidsToRefund[msg.sender];
        if (refundAmount > 0) {
            bidsToRefund[msg.sender] = 0;

            if (!payable(msg.sender).send(refundAmount)) {
                bidsToRefund[msg.sender] = refundAmount;
                return false;
            }
        }
        return true;
    }

    function concludeAuction() external {
        require(block.timestamp >= auctionEndTimeStamp, "Auction not yet ended.");
        require(!auctionHasEnded, "Auction has already been concluded.");

        auctionHasEnded = true;
        emit AuctionConcluded(highestBidderAddress, highestBidAmount);

        sellerAddress.transfer(highestBidAmount);
    }
}