pragma solidity ^0.4.25;
pragma experimental ABIEncoderV2

import "../libraries/LTVDecisionEngineTypes.sol";


contract LTVDecisionEngineInterface {

	function evaluateConsent(LTVDecisionEngineTypes.Params params)
		public view returns (bool signatureValid, bytes32 _id);

	function evaluateDecision(LTVDecisionEngineTypes.Params params)
		public view returns (bool _success);

}
