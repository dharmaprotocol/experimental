pragma solidity 0.4.24;
pragma experimental ABIEncoderV2;

import "./DebtKernelInterface.sol";
import "./DebtTokenInterface.sol";
import "./TokenTransferProxyInterface.sol";

contract ContractRegistryInterface {

    DebtKernelInterface public debtKernel;
    DebtTokenInterface public debtToken;
    TokenTransferProxyInterface public tokenTransferProxy;

    function ContractRegistryInterface(
        address _debtKernel,
        address _debtToken,
        address _tokenTransferProxy
    )
        public
    {
        debtKernel = DebtKernelInterface(_debtKernel);
        debtToken = DebtTokenInterface(_debtToken);
        tokenTransferProxy = TokenTransferProxyInterface(_tokenTransferProxy);
    }

}
