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

    function fillDebtOffer(OrderLibrary.DebtOrder memory order) public returns (bytes32 id) {
        id = hashCreditorCommitmentForOrder(order);

        if (!evaluateConsent(order)) {
            emit CreditorProxyError(uint8(Errors.DEBT_OFFER_NON_CONSENSUAL), order.creditor, id);
            return NULL_ISSUANCE_HASH;
        }

        if (debtOfferFilled[id]) {
            emit CreditorProxyError(uint8(Errors.DEBT_OFFER_ALREADY_FILLED), order.creditor, id);
            return NULL_ISSUANCE_HASH;
        }

        if (debtOfferCancelled[id]) {
            emit CreditorProxyError(uint8(Errors.DEBT_OFFER_CANCELLED), order.creditor, id);
            return NULL_ISSUANCE_HASH;
        }

        bytes32 agreementId = sendOrderToKernel(order);

        require(agreementId != NULL_ISSUANCE_HASH);

        // TODO: Log success.
        debtOfferFilled[id] = true;

        return id;
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

    function cancelDebtOffer(DebtOrder memory order)
        public returns (bool)
    {
        // Sender must be the creditor.
        if (msg.sender != order.creditor) {
            return false;
        }

        bytes32 id = hashCreditorCommitmentForOrder(order);

        // Debt offer must not already be filled.
        if (debtOfferFilled[id]) {
            return false;
        }

        debtOfferCancelled[id] = true;

        return true;
    }
}
