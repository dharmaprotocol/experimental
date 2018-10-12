pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "./DecisionEngines/NaiveDecisionEngine.sol";
import "./interfaces/CreditorProxyCoreInterface.sol";
import "../shared/libraries/OrderLibrary.sol";
import "../shared/interfaces/ContractRegistryInterface.sol";

contract NaiveCreditorProxy is NaiveDecisionEngine, CreditorProxyCoreInterface {

    mapping (bytes32 => bool) public debtOfferCancelled;
    mapping (bytes32 => bool) public debtOfferFilled;

    bytes32 constant internal NULL_ISSUANCE_HASH = bytes32(0);

    ContractRegistryInterface public contractRegistry;

    function NaiveCreditorProxy(address _contractRegistry) public {
        contractRegistry = ContractRegistryInterface(_contractRegistry);
    }

    function fillDebtOffer(DebtOrder memory order) public returns (bytes32 agreementId) {
        bytes32 creditorCommitmentHash = hashCreditorCommitmentForOrder(order);

        if (!evaluateConsent(order)) {
            emit CreditorProxyError(uint8(Errors.DEBT_OFFER_NON_CONSENSUAL), order.creditor, creditorCommitmentHash);
            return NULL_ISSUANCE_HASH;
        }

        if (debtOfferFilled[creditorCommitmentHash]) {
            emit CreditorProxyError(uint8(Errors.DEBT_OFFER_ALREADY_FILLED), order.creditor, creditorCommitmentHash);
            return NULL_ISSUANCE_HASH;
        }

        if (debtOfferCancelled[creditorCommitmentHash]) {
            emit CreditorProxyError(uint8(Errors.DEBT_OFFER_CANCELLED), order.creditor, creditorCommitmentHash);
            return NULL_ISSUANCE_HASH;
        }

        agreementId = sendOrderToKernel(order);

        require(agreementId != NULL_ISSUANCE_HASH);

        debtOfferFilled[creditorCommitmentHash] = true;

        contractRegistry.debtToken().transfer(order.creditor, uint256(agreementId));

        emit DebtOfferFilled(order.creditor, creditorCommitmentHash, agreementId);

        return agreementId;
    }

    function sendOrderToKernel(DebtOrder memory order) internal returns (bytes32 id) {
        address[6] memory orderAddresses;
        uint[8] memory orderValues;
        bytes32[1] memory orderBytes32;
        uint8[3] memory signaturesV;
        bytes32[3] memory signaturesR;
        bytes32[3] memory signaturesS;

        (orderAddresses, orderValues, orderBytes32, signaturesV, signaturesR, signaturesS) = unpackDebtOrder(order);

        return contractRegistry.debtKernel().fillDebtOrder(
            address(this),
            orderAddresses,
            orderValues,
            orderBytes32,
            signaturesV,
            signaturesR,
            signaturesS
        );
    }

    function cancelDebtOffer(
        DebtOrder memory order
    )
        public
        returns (bool succeeded)
    {
        // Sender must be the creditor.
        if (msg.sender != order.creditor) {
            return false;
        }

        bytes32 creditorCommitmentHash = hashCreditorCommitmentForOrder(order);

        // Debt offer must not already be filled.
        if (debtOfferFilled[creditorCommitmentHash]) {
            return false;
        }

        debtOfferCancelled[creditorCommitmentHash] = true;

        emit DebtOfferCancelled(order.creditor, creditorCommitmentHash);

        return true;
    }
}
