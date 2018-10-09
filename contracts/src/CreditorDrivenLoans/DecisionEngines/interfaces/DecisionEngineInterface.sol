pragma solidity 0.4.24;

import "../libraries/DecisionEngineTypes.sol";


contract DecisionEngineInterface {
	function evaluateConsent(DecisionEngineTypes.EvaluationParams params)
		public view returns (bool _success, bytes32 _id);

	function evaluateDecision(DecisionEngineTypes.EvaluationParams params)
		public view returns (bool _success);
}
