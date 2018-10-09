pragma solidity 0.4.25;
//pragma experimental ABIEncoderV2;

import "DecisionEngines/LTVDecisionEngine.sol";


contract LTVCreditorProxy is
	LTVDecisionEngine,
	LTVDecisionEngineTypes,
	OrderLibrary
{

	mapping (bytes32 => bool) public debtOfferCancelled;
	mapping (bytes32 => bool) public debtOfferFilled;

	bytes32 constant internal NULL_ISSUANCE_HASH = bytes32(0);

	function fillDebtOffer(Params params)
		public whenNotPaused returns (bytes32 id)
	{
		(isConsensual, id) = evaluateConsent(params);

		if (!isConsensual) {
			return NULL_ISSUANCE_HASH;
		}

		if (evaluateDecision(params)) {
			// The order is consensual and has an acceptable LTV ratio.
			debtOfferFilled[id] = true;
		}

		return id;
	}

	function cancelDebtOffer(LTVDecisionEngineTypes.Params params) public whenNotPaused returns (bool) {
		// sender must be the creditor.
		require(msg.sender == order.creditor);

		CommitmentValues commitmentValues = params.creditorCommitment.values;
		DebtOrder order = params.order;

		bytes32 id = hashOrder(commitmentValues, order);

		// debt offer must not already be filled.
		require(!debtOfferFilled[id]);

		debtOfferCancelled[id] = true;

		return true;
	}

}
