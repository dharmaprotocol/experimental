pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;


contract CollateralizerInterface {

	function unpackCollateralParametersFromBytes(
		bytes32 parameters
	) public pure returns (uint, uint, uint);

}
