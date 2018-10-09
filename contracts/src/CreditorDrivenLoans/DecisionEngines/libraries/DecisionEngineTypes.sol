pragma solidity 0.4.24;

import "../../../shared/libraries/SignatureTypes.sol";


contract DecisionEngineTypes {
	struct EvaluationParams {
		address creditor;
		bytes32[] data;
		SignatureTypes.ECDSASignature[] signatures;
	}
}
