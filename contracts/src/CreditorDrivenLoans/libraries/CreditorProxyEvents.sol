pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

contract CreditorProxyEvents {

    event DebtOfferCancelled(
        address indexed _creditor,
        bytes32 indexed _creditorCommitmentHash
    );

    event DebtOfferFilled(
        address indexed _creditor,
        bytes32 indexed _creditorCommitmentHash,
        bytes32 indexed _agreementId
    );
}
