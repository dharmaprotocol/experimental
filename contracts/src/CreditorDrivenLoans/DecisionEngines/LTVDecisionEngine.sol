pragma solidity 0.4.25;

// External dependencies
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

// Libraries
import "./libraries/LTVDecisionEngineTypes.sol";


contract LTVDecisionEngine {
	using SafeMath for uint;

	uint public constant PRECISION = 4;

	function evaluateConsent(LTVDecisionEngineTypes.Params params)
		public view returns (bool signatureValid, bytes32 _id)
	{
		// Access the commitment values from the given args.
		LTVDecisionEngineTypes.CommitmentValues commitmentValues = params.commitmentValues;

		// Create a hash of the commitment values.
		bytes32 commitmentHash = keccak256(
			// LTV specific values.
			commitmentValues.maxLTV,
			commitmentValues.principalToken,
			commitmentValues.principalAmount,
			commitmentValues.expirationTimestamp,
			// Order specific values.
			commitmentValues.creditor,
			commitmentValues.repaymentRouter,
			commitmentValues.creditorFee,
			commitmentValues.underwriter,
			commitmentValues.underwriterRiskRating,
			commitmentValues.termsContract,
			commitmentValues.termsContractParameters,
			commitmentValues.commitmentExpirationTimestampInSec,
			commitmentValues.salt
		);

		return SignaturesLibrary.isValidSignature(
			params.creditor,
			commitmentHash,
			params.creditorSignature
		);
	}

	// Returns true if the creditor-initiated order has not expired, and the LTV is below the max.
	function evaluateDecision(LTVDecisionEngineTypes.Params params)
		public view returns (bool _success)
	{
		LTVDecisionEngineTypes.Price principalTokenPrice = params.principalPrice;
		LTVDecisionEngineTypes.Price collateralTokenPrice = params.collateralPrice;

		LTVDecisionEngineTypes.CommitmentValues commitmentValues = params.creditorCommitment.values;
		OrderLibrary.DebtOrder order = params.order;

		if (isExpired(commitmentValues.expirationTimestamp)) {
			return false;
		}

		uint ltv = computeLTV(
			principalTokenPrice.value,
			collateralTokenPrice.value,
			commitmentValues.principalAmount,
			order.collateralAmount
		);

		uint maxLTVWithPrecision = maxLTV.mul(10 ** (PRECISION.sub(2)));

		return computedLTV > maxLTVWithPrecision;
	}

	function computeLTV(
		uint principalTokenPrice,
		uint collateralTokenPrice,
		uint principalAmount,
		uint collateralAmount
	)
		public constant returns (uint)
	{
		uint principalValue = principalTokenPrice.mul(principalAmount).mul(10 ** PRECISION);
		uint collateralValue = collateralTokenPrice.mul(collateralAmount);

		return principalValue.div(collateralValue);
	}

	function isExpired(uint expirationTimestampInSec)
		public view returns (bool expired)
	{
		return expirationTimestampInSec < block.timestamp;
	}
}
