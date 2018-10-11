pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "../../shared/libraries/OrderLibrary.sol";
import "../libraries/CreditorProxyErrors.sol";

contract CreditorProxyCoreInterface is CreditorProxyErrors, CreditorProxyEvents {

    function fillDebtOffer(
        OrderLibrary.DebtOrder memory order
    ) public returns (bytes32 agreementId);

    function cancelDebtOffer(
        OrderLibrary.DebtOrder memory order
    ) public returns (bool success);

}
