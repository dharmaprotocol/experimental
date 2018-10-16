pragma solidity 0.4.24;
pragma experimental ABIEncoderV2;

import "./CollateralizerInterface.sol";
import "./DebtKernelInterface.sol";
import "./DebtTokenInterface.sol";
import "./TokenTransferProxyInterface.sol";

contract ContractRegistryInterface {

    CollateralizerInterface public collateralizer;
    DebtKernelInterface public debtKernel;
    DebtTokenInterface public debtToken;
    TokenTransferProxyInterface public tokenTransferProxy;

    function ContractRegistryInterface(
        address _collateralizer,
        address _debtKernel,
        address _debtToken,
        address _tokenTransferProxy
    )
        public
    {
        collateralizer = CollateralizerInterface(_collateralizer);
        debtKernel = DebtKernelInterface(_debtKernel);
        debtToken = DebtTokenInterface(_debtToken);
        tokenTransferProxy = TokenTransferProxyInterface(_tokenTransferProxy);
    }

}
