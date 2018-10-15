pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;


import "./TermsContractInterface.sol";

contract SimpleInterestTermsContractInterface is TermsContractInterface {

    function unpackParametersFromBytes(
        bytes32 parameters
    ) public pure returns (
        uint _principalTokenIndex,
        uint _principalAmount,
        uint _interestRate,
        uint _amortizationUnitType,
        uint _termLengthInAmortizationUnits
    );

}
