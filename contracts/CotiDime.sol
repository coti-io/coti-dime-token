pragma solidity 0.4.24;

import "zeppelin-solidity/contracts/ownership/HasNoEther.sol";
import "zeppelin-solidity/contracts/ownership/Claimable.sol";
import "zeppelin-solidity/contracts/token/ERC20/MintableToken.sol";

/// @title COTI-DIME token for COTI-ZERO platform
contract CotiDime is HasNoEther, Claimable, MintableToken {
    string public constant name = "COTI-DIME";
    string public constant symbol = "CPS";
    uint8 public constant decimals = 18;

    // This modifier will be used to disable ERC20 transfer functionalities during the minting process.
    modifier isTransferable() {
        require(mintingFinished, "Minting hasn't finished yet");
        _;
    }

    /// @dev Transfer token for a specified address
    /// @param _to address The address to transfer to.
    /// @param _value uint256 The amount to be transferred.
    /// @return Calling super.transfer and returns true if successful.
    function transfer(address _to, uint256 _value) public isTransferable returns (bool) {
        return super.transfer(_to, _value);
    }

    /// @dev Transfer tokens from one address to another.
    /// @param _from address The address which you want to send tokens from.
    /// @param _to address The address which you want to transfer to.
    /// @param _value uint256 The amount of tokens to be transferred.
    /// @return Calling super.transferFrom and returns true if successful.
    function transferFrom(address _from, address _to, uint256 _value) public isTransferable returns (bool) {
        return super.transferFrom(_from, _to, _value);
    }
}
