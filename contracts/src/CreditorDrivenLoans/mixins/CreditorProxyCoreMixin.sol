pragma solidity ^0.4.25;
pragma experimental ABIEncoderV2;

import "../interfaces/CreditorProxyCoreInterface.sol";
import "../../shared/libraries/OrderLibrary.sol";
import "zeppelin-solidity/contracts/lifecycle/Pausable.sol";

contract CreditorProxyCoreMixin is CreditorProxyCoreInterface, OrderLibrary, Pausable {

    mapping (bytes32 => bool) public debtOfferCancelled;
    mapping (bytes32 => bool) public debtOfferFilled;

    bytes32 constant internal NULL_ISSUANCE_HASH = bytes32(0);

    function fillDebtOffer(DebtOrder memory order) public  whenNotPaused returns (bytes32) {
        return NULL_ISSUANCE_HASH;
    }

    function cancelDebtOffer(DebtOrder memory order) public whenNotPaused returns (bool) {
        return true;
    }
}
