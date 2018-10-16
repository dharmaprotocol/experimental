pragma solidity 0.4.24;
pragma experimental ABIEncoderV2;

contract DebtTokenInterface {

    function transfer(address _to, uint _tokenId) public;

    function exists(uint256 _tokenId) public view returns (bool);

}
