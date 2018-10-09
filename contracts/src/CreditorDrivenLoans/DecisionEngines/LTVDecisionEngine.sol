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
		// Checks that the given creditor values were signed by the creditor.
		bool validCreditorSignature = verifyCreditorCommitmentHash(
			params.creditor,
			params.commitmentValues,
			params.order,
			params.creditorSignature
		);

		// We return early if the creditor values were not signed correctly.
		if (!validCreditorSignature) {
			return false;
		}

		// Checks that the given price feed data was signed by the price feed operator.
		return verifyPrices(
			params.priceFeedOperator,
			params.principalPrice,
			params.collateralPrice
		);
	}

	function verifyCreditorCommitmentHash(
		address creditor,
		LTVDecisionEngineTypes.CommitmentValues commitmentValues,
		OrderLibrary.DebtOrder order,
		SignaturesLibrary.ECDSASignature signature
	)
	{
		// Create a hash of the commitment values.
		bytes32 commitmentHash = keccak256(
			// LTV specific values.
			commitmentValues.maxLTV,
			commitmentValues.principalToken,
			commitmentValues.principalAmount,
			commitmentValues.expirationTimestamp,
			// Order specific values.
			order.creditor,
			order.repaymentRouter,
			order.creditorFee,
			order.underwriter,
			order.underwriterRiskRating,
			order.termsContract,
			order.termsContractParameters,
			order.commitmentExpirationTimestampInSec,
			order.salt
		);

		return SignaturesLibrary.isValidSignature(
			creditor,
			commitmentHash,
			signature
		);
	}

	function verifyPrices(
		address priceFeedOperator,
		LTVDecisionEngineTypes.Price principalPrice,
		LTVDecisionEngineTypes.Price collateralPrice
	)
		public view returns (bool)
	{
		bytes32 principalPriceHash = keccack256(
			principalPrice.value,
			principalPrice.timestamp
		);

		bytes32 collateralPriceHash = keccack256(
			collateralPrice.value,
			collateralPrice.timestamp
		);

		bool principalPriceValid = SignaturesLibrary.isValidSignature(
			priceFeedOperator,
			principalPriceHash,
			principalPrice.signature
		);

		// We return early if the principal price information was not signed correctly.
		if (!principalPriceValid) {
			return false;
		}

		return SignaturesLibrary.isValidSignature(
			priceFeedOperator,
			collateralPriceHash,
			collateralPrice.signature
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
