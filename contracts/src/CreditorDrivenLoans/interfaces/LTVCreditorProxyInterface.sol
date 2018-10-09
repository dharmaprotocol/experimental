pragma solidity ^0.4.25;

import "../DecisionEngines/libraries/LTVDecisionEngineTypes.sol";


contract LTVCreditorProxyInterface {

	function evaluateConsent(LTVDecisionEngineTypes.Params params)
		public view returns (bool signatureValid, bytes32 _id);

	function evaluateDecision(LTVDecisionEngineTypes.Params params)
		public view returns (bool _success);
}
