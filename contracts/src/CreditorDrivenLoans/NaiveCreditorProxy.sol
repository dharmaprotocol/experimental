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

    function NaiveCreditorProxy(address _contractRegistry) {
        contractRegistry = ContractRegistryInterface(_contractRegistry);
    }

    function fillDebtOffer(OrderLibrary.DebtOrder memory order) public returns (bytes32 id) {
        bool isConsensual;

        (isConsensual, id) = evaluateConsent(order);

        if (!isConsensual) {
            return NULL_ISSUANCE_HASH;
        }

        // TODO: Log success.
        debtOfferFilled[id] = true;

        return id;
    }

    function cancelDebtOffer(OrderLibrary.DebtOrder memory order)
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
