pragma solidity ^0.4.24;

contract CreditorProxyErrors {
    enum Errors {
            DEBT_OFFER_CANCELLED,
            DEBT_OFFER_ALREADY_FILLED,
            DEBT_OFFER_NON_CONSENSUAL,
            CREDITOR_BALANCE_OR_ALLOWANCE_INSUFFICIENT
        }

    event CreditorProxyError(
        uint8 indexed _errorId,
        address indexed _creditor,
        bytes32 indexed _creditorCommitmentHash
    );
}
