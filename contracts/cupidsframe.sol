// SPDX-License-Identifier: MIT
// Cupid's Frame
// By Andrew Jiang (@ok, FID 3391)

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721//ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CupidsFrame is ERC721, Ownable {
    uint256 public currentTokenId = 0;
    string public defaultURI;

    mapping(address authorizedMinter => bool authorized) public authorizedMinters;
    mapping(uint256 tokenId => string tokenURI) public tokenURIs;

    // Keep track of mint limits
    uint256 public maxMintPerAddress;
    mapping(address minted => uint256 count) public mintCount;

    event DefaultTokenURISet(string tokenURI);
    event TokenURISet(uint256 indexed tokenId, string tokenURI);
    event AuthorizedMinterSet(address indexed minter, bool authorized);

    modifier onlyAuthorizedMinter() {
        require(authorizedMinters[msg.sender], "CupidsFrame: Mint must be triggered by API");
        _;
    }

    modifier onlyBelowMaxMint(address to) {
        require(mintCount[to] < maxMintPerAddress, "CupidsFrame: Max mint reached");
        _;
    }

    // The deployer is set as the initial owner by default. Make sure to
    // transfer this to a Safe or other multisig for long-term use!
    // You can call `transferOwnership` to do this.
    constructor() ERC721("CupidsFrame", "CUPID") {
        // Update this with your own NFT collection's metadata
        defaultURI = "https://4z3gtphsxwrowdmb7kxusn5euj2cqprnr4faa2qrubgwizzsmuja.arweave.net/5nZpvPK9ousNgfqvSTekonQoPi2PCgBqEaBNZGcyZRI";
        maxMintPerAddress = 1;

        _transferOwnership(msg.sender);

        // The deployer is set as an authorized minter, allowing them to set up
        // owner mints manually via the contract as needed
        authorizedMinters[msg.sender] = true;
        emit AuthorizedMinterSet(msg.sender, true);

        // Authorize Syndicate's API-based wallet pool as a minter on Base
        // Mainnet
        authorizeBaseMainnetSyndicateAPI();
    }

    function mint(address to) public onlyAuthorizedMinter onlyBelowMaxMint(to) {
        ++currentTokenId;
        ++mintCount[to];
        _mint(to, currentTokenId);
    }

    function mint(address to, string memory _tokenURI) public onlyAuthorizedMinter onlyBelowMaxMint(to) {
        ++currentTokenId;
        ++mintCount[to];
        tokenURIs[currentTokenId] = _tokenURI;
        _mint(to, currentTokenId);

        emit TokenURISet(currentTokenId, _tokenURI);
    }

    function setTokenURI(uint256 tokenId, string memory _tokenURI)
        public
        onlyAuthorizedMinter
    {
        tokenURIs[tokenId] = _tokenURI;

        emit TokenURISet(tokenId, _tokenURI);
    }

    function setDefaultTokenURI(string memory _tokenURI) public onlyOwner {
        defaultURI = _tokenURI;
        emit DefaultTokenURISet(_tokenURI);
    }

    function tokenURI(uint256 tokenId) public view virtual override(ERC721) returns (string memory) {
        if (bytes(tokenURIs[tokenId]).length > 0) {
            return tokenURIs[tokenId];
        } else {
            return defaultURI;
        }
    }

    // Only the owner can set the max mint per address
    function setMaxMintPerAddress(uint256 _maxMintPerAddress) public onlyOwner {
        maxMintPerAddress = _maxMintPerAddress;
    }

    // Only the owner can set authorized minters.
    function setAuthorizedMinter(address minter, bool authorized) public onlyOwner {
        authorizedMinters[minter] = authorized;

        emit AuthorizedMinterSet(minter, authorized);
    }

    // Base Mainnet Syndicate Wallets
    function authorizeBaseMainnetSyndicateAPI() internal {
        authorizedMinters[0x3D0263e0101DE2E9070737Df30236867485A5208] = true;
        authorizedMinters[0x98407Cb54D8dc219d8BF04C9018B512dDbB96caB] = true;
        authorizedMinters[0xF43A72c1a41b7361728C83699f69b5280161F0A5] = true;
        authorizedMinters[0x94702712BA81C0D065665B8b0312D87B190EbA37] = true;
        authorizedMinters[0x10FD71C6a3eF8F75d65ab9F3d77c364C321Faeb5] = true;

        emit AuthorizedMinterSet(0x3D0263e0101DE2E9070737Df30236867485A5208, true);
        emit AuthorizedMinterSet(0x98407Cb54D8dc219d8BF04C9018B512dDbB96caB, true);
        emit AuthorizedMinterSet(0xF43A72c1a41b7361728C83699f69b5280161F0A5, true);
        emit AuthorizedMinterSet(0x94702712BA81C0D065665B8b0312D87B190EbA37, true);
        emit AuthorizedMinterSet(0x10FD71C6a3eF8F75d65ab9F3d77c364C321Faeb5, true);
    }

    fallback() external payable {
        revert("CupidsFrame: Does not accept ETH");
    }
}