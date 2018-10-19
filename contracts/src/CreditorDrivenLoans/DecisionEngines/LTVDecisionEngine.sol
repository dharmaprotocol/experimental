pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

// External dependencies
import "zeppelin-solidity/contracts/math/SafeMath.sol";

// Libraries
import "./libraries/LTVDecisionEngineTypes.sol";
import "../../shared/libraries/SignaturesLibrary.sol";
import "../../shared/libraries/OrderLibrary.sol";

// Interfaces
import "../../shared/interfaces/ContractRegistryInterface.sol";
import "../../shared/interfaces/CollateralizerInterface.sol";
import "../../shared/interfaces/SimpleInterestTermsContractInterface.sol";

contract LTVDecisionEngine is LTVDecisionEngineTypes, SignaturesLibrary, OrderLibrary
{
	using SafeMath for uint;

	uint public constant PRECISION = 4;

	uint public constant MAX_PRICE_TTL_IN_SECONDS = 600;

	ContractRegistryInterface public contractRegistry;

	function LTVDecisionEngine(address _contractRegistry) public {
        contractRegistry = ContractRegistryInterface(_contractRegistry);
    }

	function evaluateConsent(Params params, bytes32 commitmentHash)
		public view returns (bool)
	{
		// Checks that the given creditor values were signed by the creditor.
		if (!isValidSignature(
			params.creditor,
			commitmentHash,
			params.creditorCommitment.signature
		)) {
			// We return early if the creditor values were not signed correctly.
			return false;
		}

		// Checks that the given price feed data was signed by the price feed operator.
		return (
			verifyPrices(
				params.priceFeedOperator,
				params.principalPrice,
				params.collateralPrice
			)
		);
	}

	// Returns true if the creditor-initiated order has not expired, and the LTV is below the max.
	function evaluateDecision(Params memory params)
		public view returns (bool _success)
	{
		LTVDecisionEngineTypes.Price memory principalTokenPrice = params.principalPrice;
		LTVDecisionEngineTypes.Price memory collateralTokenPrice = params.collateralPrice;

		uint maxLTV = params.creditorCommitment.values.maxLTV;
		OrderLibrary.DebtOrder memory order = params.order;

		uint collateralValue = collateralTokenPrice.value;

		if (isExpired(order.expirationTimestampInSec)) {
			return false;
		}

		if (order.collateralAmount == 0 || collateralValue == 0) {
			return false;
		}

		uint ltv = computeLTV(
			principalTokenPrice.value,
			collateralTokenPrice.value,
			order.principalAmount,
			order.collateralAmount
		);

		uint maxLTVWithPrecision = maxLTV.mul(10 ** (PRECISION.sub(2)));

		return ltv <= maxLTVWithPrecision;
	}

	function hashCreditorCommitmentForOrder(CommitmentValues commitmentValues, OrderLibrary.DebtOrder order)
	public view returns (bytes32)
	{
		bytes32 termsContractCommitmentHash =
			getTermsContractCommitmentHash(order.termsContract, order.termsContractParameters);

		return keccak256(
			// order values
			order.creditor,
			order.kernelVersion,
			order.issuanceVersion,
			order.termsContract,
			order.principalToken,
			order.salt,
			order.creditorFee,
			order.expirationTimestampInSec,
			// commitment values
			commitmentValues.maxLTV,
			commitmentValues.maxPrincipalAmount,
			// hashed terms contract commitments
			termsContractCommitmentHash
		);
	}

	function getTermsContractCommitmentHash(
		address termsContract,
		bytes32 termsContractParameters
	) public view returns (bytes32) {
		SimpleInterestParameters memory simpleInterestParameters =
			unpackSimpleInterestParameters(termsContract, termsContractParameters);

		CollateralParameters memory collateralParameters =
			unpackCollateralParameters(termsContractParameters);

		return keccak256(
			// unpacked termsContractParameters
			simpleInterestParameters.principalTokenIndex,
			simpleInterestParameters.interestRate,
			simpleInterestParameters.amortizationUnitType,
			simpleInterestParameters.termLengthInAmortizationUnits,
			collateralParameters.collateralTokenIndex,
			collateralParameters.gracePeriodInDays
		);
	}

	function unpackSimpleInterestParameters(
		address termsContract,
		bytes32 termsContractParameters
	)
		public pure returns (SimpleInterestParameters)
	{
		// use simple interest terms contract interface to unpack simple interest terms
		SimpleInterestTermsContractInterface simpleInterestTermsContract = SimpleInterestTermsContractInterface(termsContract);

		var (principalTokenIndex, principalAmount, interestRate, amortizationUnitType, termLengthInAmortizationUnits) =
			simpleInterestTermsContract.unpackParametersFromBytes(termsContractParameters);

		return SimpleInterestParameters({
			principalTokenIndex: principalTokenIndex,
			principalAmount: principalAmount,
			interestRate: interestRate,
			amortizationUnitType: amortizationUnitType,
			termLengthInAmortizationUnits: termLengthInAmortizationUnits
		});
	}

	function unpackCollateralParameters(
		bytes32 termsContractParameters
	)
		public view returns (CollateralParameters)
	{
		CollateralizerInterface collateralizer = CollateralizerInterface(contractRegistry.collateralizer());

		var (collateralTokenIndex, collateralAmount, gracePeriodInDays) =
			collateralizer.unpackCollateralParametersFromBytes(termsContractParameters);

		return CollateralParameters({
			collateralTokenIndex: collateralTokenIndex,
			collateralAmount: collateralAmount,
			gracePeriodInDays: gracePeriodInDays
		});
	}

	function verifyPrices(
		address priceFeedOperator,
		LTVDecisionEngineTypes.Price principalPrice,
		LTVDecisionEngineTypes.Price collateralPrice
	)
		internal view returns (bool)
	{
		uint minPriceTimestamp = block.timestamp - MAX_PRICE_TTL_IN_SECONDS;

		if (principalPrice.timestamp < minPriceTimestamp ||
			collateralPrice.timestamp < minPriceTimestamp) {
			return false;
		}

		bytes32 principalPriceHash = keccak256(
			principalPrice.value,
			principalPrice.tokenAddress,
			principalPrice.timestamp
		);

		bytes32 collateralPriceHash = keccak256(
			collateralPrice.value,
			collateralPrice.tokenAddress,
			collateralPrice.timestamp
		);

		bool principalPriceValid = isValidSignature(
			priceFeedOperator,
			principalPriceHash,
			principalPrice.signature
		);

		// We return early if the principal price information was not signed correctly.
		if (!principalPriceValid) {
			return false;
		}

		return isValidSignature(
			priceFeedOperator,
			collateralPriceHash,
			collateralPrice.signature
		);
	}

	function computeLTV(
		uint principalTokenPrice,
		uint collateralTokenPrice,
		uint principalAmount,
		uint collateralAmount
	)
		internal constant returns (uint)
	{
		uint principalValue = principalTokenPrice.mul(principalAmount).mul(10 ** PRECISION);
		uint collateralValue = collateralTokenPrice.mul(collateralAmount);

		return principalValue.div(collateralValue);
	}

	function isExpired(uint expirationTimestampInSec)
		internal view returns (bool expired)
	{
		return expirationTimestampInSec < block.timestamp;
	}
}
