// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DeAIMarketplace {

    address public platformOwner;

    // ─── Structs ──────────────────────────────────────────────────────────────

    struct OwnerShare {
        address payable wallet;
        uint256 shareBps;       // basis points: 10000 = 100%, 5000 = 50%
    }

    struct Model {
        uint256 id;
        string  ipfsCid;
        uint256 price;
        uint256 subscriptionPrice;
        bool    isActive;
        uint256 ratingTotal;
        uint256 ratingCount;
        uint256 totalEarned;    // lifetime earnings — show this to judges
        // ownership
        uint256    ownerCount;
        OwnerShare[10] owners;  // max 10 co-owners
    }

    struct Job {
        uint256 id;
        address buyer;
        uint256 modelId;
        uint256 pricePaid;
        bool    isCompleted;
        bool    isRated;
        string  resultCid;      // pinned to IPFS, stored on-chain forever
    }

    struct Subscription {
        uint256 expiresAt;
        bool    isActive;
    }

    struct ComputeNode {
        bool    isRegistered;
        uint256 jobsCompleted;
        uint256 totalEarned;
        uint256 reputationScore;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    uint256 public modelCount;
    uint256 public jobCount;
    uint256 public platformFees;

    mapping(uint256 => Model)                            public models;
    mapping(uint256 => Job)                              public jobs;
    mapping(address => uint256[])                        public jobsByBuyer;
    mapping(uint256 => uint256[])                        public jobsByModel;
    mapping(address => uint256[])                        public modelsByCreator;
    mapping(address => mapping(uint256 => Subscription)) public subscriptions;
    mapping(uint256 => mapping(address => bool))         public modelAccess;
    mapping(address => ComputeNode)                      public computeNodes;

    address[] public nodeList;

    // ─── Events ───────────────────────────────────────────────────────────────

    event ModelRegistered(uint256 indexed modelId, address indexed creator, string ipfsCid, uint256 price);
    event OwnerAdded(uint256 indexed modelId, address indexed newOwner, uint256 shareBps);
    event OwnershipTransferred(uint256 indexed modelId, address indexed from, address indexed to, uint256 shareBps);
    event JobCreated(uint256 indexed jobId, uint256 indexed modelId, address indexed buyer, uint256 price);
    event JobCompleted(uint256 indexed jobId, address indexed node, string resultCid);
    event ModelRated(uint256 indexed modelId, uint256 indexed jobId, uint8 rating);
    event Subscribed(address indexed user, uint256 indexed modelId, uint256 expiresAt);
    event NodeRegistered(address indexed node);
    event AccessGranted(uint256 indexed modelId, address indexed user);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == platformOwner, "Only platform owner");
        _;
    }

    modifier onlyNode() {
        require(computeNodes[msg.sender].isRegistered, "Not a registered node");
        _;
    }

    modifier onlyModelOwner(uint256 _modelId) {
        require(_isModelOwner(_modelId, msg.sender), "Not a model owner");
        _;
    }

    constructor() {
        platformOwner = msg.sender;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  MODEL REGISTRATION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Register a model with a single owner (simple path).
     */
    function registerModel(
        string memory _ipfsCid,
        uint256 _price,
        uint256 _subscriptionPrice
    ) public returns (uint256 modelId) {
        require(bytes(_ipfsCid).length > 0, "CID required");
        require(_price > 0, "Price must be > 0");

        modelCount++;
        modelId = modelCount;

        Model storage m     = models[modelId];
        m.id                = modelId;
        m.ipfsCid           = _ipfsCid;
        m.price             = _price;
        m.subscriptionPrice = _subscriptionPrice;
        m.isActive          = true;
        m.ownerCount        = 1;
        m.owners[0]         = OwnerShare(payable(msg.sender), 10000); // 100%

        modelAccess[modelId][msg.sender] = true;
        modelsByCreator[msg.sender].push(modelId);

        emit ModelRegistered(modelId, msg.sender, _ipfsCid, _price);
    }

    /**
     * @notice Register a model with multiple co-owners from day one.
     * @param _owners    Wallets of all co-owners (including yourself)
     * @param _sharesBps Each owner's share in basis points — MUST sum to 10000
     *
     * Example: 3 co-owners at 50%, 30%, 20%
     * _sharesBps = [5000, 3000, 2000]
     */
    function registerModelMultiOwner(
        string memory _ipfsCid,
        uint256 _price,
        uint256 _subscriptionPrice,
        address payable[] memory _owners,
        uint256[] memory _sharesBps
    ) public returns (uint256 modelId) {
        require(bytes(_ipfsCid).length > 0,          "CID required");
        require(_price > 0,                           "Price must be > 0");
        require(_owners.length == _sharesBps.length,  "Length mismatch");
        require(_owners.length >= 1,                  "Need at least 1 owner");
        require(_owners.length <= 10,                 "Max 10 owners");

        uint256 totalBps;
        for (uint256 i = 0; i < _sharesBps.length; i++) {
            require(_owners[i] != address(0), "Invalid owner address");
            totalBps += _sharesBps[i];
        }
        require(totalBps == 10000, "Shares must sum to 10000 bps");

        modelCount++;
        modelId = modelCount;

        Model storage m     = models[modelId];
        m.id                = modelId;
        m.ipfsCid           = _ipfsCid;
        m.price             = _price;
        m.subscriptionPrice = _subscriptionPrice;
        m.isActive          = true;
        m.ownerCount        = _owners.length;

        for (uint256 i = 0; i < _owners.length; i++) {
            m.owners[i] = OwnerShare(_owners[i], _sharesBps[i]);
            modelAccess[modelId][_owners[i]] = true;
            modelsByCreator[_owners[i]].push(modelId);
            emit OwnerAdded(modelId, _owners[i], _sharesBps[i]);
        }

        emit ModelRegistered(modelId, msg.sender, _ipfsCid, _price);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  OWNERSHIP MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Transfer your ENTIRE share to another wallet.
     *         You lose all ownership. They gain your full share.
     */
    function transferOwnership(
        uint256 _modelId,
        address payable _to
    ) public onlyModelOwner(_modelId) {
        require(_to != address(0),                 "Invalid address");
        require(!_isModelOwner(_modelId, _to),     "Already an owner");

        Model storage m = models[_modelId];

        for (uint256 i = 0; i < m.ownerCount; i++) {
            if (m.owners[i].wallet == payable(msg.sender)) {
                uint256 share    = m.owners[i].shareBps;
                m.owners[i].wallet = _to;

                modelAccess[_modelId][_to]         = true;
                modelAccess[_modelId][msg.sender]   = false;
                modelsByCreator[_to].push(_modelId);

                emit OwnershipTransferred(_modelId, msg.sender, _to, share);
                return;
            }
        }
    }

    /**
     * @notice Transfer a PARTIAL share to another wallet.
     *         Useful for selling a stake while keeping the rest.
     * @param _shareBps How many basis points to transfer (must be <= your share)
     *
     * Example: You own 60% (6000 bps), transfer 20% (2000 bps)
     * → You keep 40%, recipient gains 20%
     */
    function transferPartialOwnership(
        uint256 _modelId,
        address payable _to,
        uint256 _shareBps
    ) public onlyModelOwner(_modelId) {
        require(_to != address(0), "Invalid address");
        require(_shareBps > 0,     "Share must be > 0");

        Model storage m = models[_modelId];

        // Find sender's index and validate share
        uint256 senderIdx = _findOwnerIndex(_modelId, msg.sender);
        require(m.owners[senderIdx].shareBps >= _shareBps, "Insufficient share");

        // Deduct from sender
        m.owners[senderIdx].shareBps -= _shareBps;

        // If recipient is already a co-owner, just add to their share
        bool recipientExists = false;
        for (uint256 i = 0; i < m.ownerCount; i++) {
            if (m.owners[i].wallet == _to) {
                m.owners[i].shareBps += _shareBps;
                recipientExists = true;
                break;
            }
        }

        // Otherwise add them as a new owner
        if (!recipientExists) {
            require(m.ownerCount < 10, "Max 10 owners reached");
            m.owners[m.ownerCount] = OwnerShare(_to, _shareBps);
            m.ownerCount++;
            modelsByCreator[_to].push(_modelId);
        }

        modelAccess[_modelId][_to] = true;

        // Revoke access if sender gave away everything
        if (m.owners[senderIdx].shareBps == 0) {
            modelAccess[_modelId][msg.sender] = false;
        }

        emit OwnershipTransferred(_modelId, msg.sender, _to, _shareBps);
    }

    /**
     * @notice Read all owners and their percentage shares.
     *         Call this from your frontend to display co-owners.
     */
    function getOwners(uint256 _modelId)
        public view
        returns (address[] memory wallets, uint256[] memory sharesBps)
    {
        Model storage m   = models[_modelId];
        wallets           = new address[](m.ownerCount);
        sharesBps         = new uint256[](m.ownerCount);

        for (uint256 i = 0; i < m.ownerCount; i++) {
            wallets[i]   = m.owners[i].wallet;
            sharesBps[i] = m.owners[i].shareBps;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  PAY-PER-USE INFERENCE
    // ═══════════════════════════════════════════════════════════════════════════

    function buyInference(uint256 _modelId) public payable {
        Model storage aiModel = models[_modelId];
        require(aiModel.isActive,           "Model not active");
        require(msg.value >= aiModel.price, "Insufficient payment");

        uint256 excess = msg.value - aiModel.price;
        if (excess > 0) {
            (bool refunded, ) = payable(msg.sender).call{value: excess}("");
            require(refunded, "Refund failed");
        }

        jobCount++;
        jobs[jobCount] = Job(jobCount, msg.sender, _modelId, aiModel.price, false, false, "");

        modelAccess[_modelId][msg.sender] = true;
        jobsByBuyer[msg.sender].push(jobCount);
        jobsByModel[_modelId].push(jobCount);

        emit JobCreated(jobCount, _modelId, msg.sender, aiModel.price);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  SUBSCRIPTION
    // ═══════════════════════════════════════════════════════════════════════════

    function subscribe(uint256 _modelId) public payable {
        Model storage aiModel = models[_modelId];
        require(aiModel.isActive,                    "Model not active");
        require(aiModel.subscriptionPrice > 0,        "No subscription tier");
        require(msg.value >= aiModel.subscriptionPrice, "Insufficient payment");

        uint256 expiresAt = block.timestamp + 30 days;
        subscriptions[msg.sender][_modelId] = Subscription(expiresAt, true);
        modelAccess[_modelId][msg.sender]   = true;

        // 80% split across all owners proportionally
        uint256 creatorPool   = (msg.value * 80) / 100;
        uint256 platformShare = msg.value - creatorPool;
        platformFees         += platformShare;

        _distributeToOwners(_modelId, creatorPool);

        emit Subscribed(msg.sender, _modelId, expiresAt);
    }

    function hasActiveSubscription(address _user, uint256 _modelId)
        public view returns (bool)
    {
        return subscriptions[_user][_modelId].expiresAt > block.timestamp;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  COMPUTE NODES
    // ═══════════════════════════════════════════════════════════════════════════

    function registerNode() public {
        require(!computeNodes[msg.sender].isRegistered, "Already registered");
        computeNodes[msg.sender] = ComputeNode(true, 0, 0, 100);
        nodeList.push(msg.sender);
        emit NodeRegistered(msg.sender);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  SUBMIT RESULT + REVENUE SPLIT
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Revenue split per job:
     *   80% → split proportionally across ALL model owners
     *   15% → compute node that ran the inference
     *    5% → platform (withdrawable by platformOwner)
     */
    function submitResult(uint256 _jobId, string memory _resultCid) public onlyNode {
        Job storage job = jobs[_jobId];
        require(!job.isCompleted,              "Already completed");
        require(bytes(_resultCid).length > 0,  "Result CID required");

        // CEI: state before money
        job.isCompleted = true;
        job.resultCid   = _resultCid;  // stored on-chain forever

        uint256 amount        = job.pricePaid;
        uint256 workerShare   = (amount * 15) / 100;
        uint256 platformShare = (amount * 5)  / 100;
        uint256 creatorPool   = amount - workerShare - platformShare; // exact 80%

        platformFees += platformShare;
        models[job.modelId].totalEarned += amount;

        computeNodes[msg.sender].jobsCompleted++;
        computeNodes[msg.sender].totalEarned += workerShare;

        // Pay worker
        (bool workerOk, ) = payable(msg.sender).call{value: workerShare}("");
        require(workerOk, "Worker payout failed");

        // Pay all model owners proportionally
        _distributeToOwners(job.modelId, creatorPool);

        emit JobCompleted(_jobId, msg.sender, _resultCid);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  RATING
    // ═══════════════════════════════════════════════════════════════════════════

    function rateModel(uint256 _jobId, uint8 _rating) public {
        require(_rating >= 1 && _rating <= 5, "Rating must be 1-5");

        Job storage job = jobs[_jobId];
        require(job.buyer == msg.sender, "Not your job");
        require(job.isCompleted,         "Job not completed");
        require(!job.isRated,            "Already rated");

        job.isRated = true;
        models[job.modelId].ratingTotal += _rating;
        models[job.modelId].ratingCount += 1;

        emit ModelRated(job.modelId, _jobId, _rating);
    }

    function getModelRating(uint256 _modelId)
        public view returns (uint256 average, uint256 totalRatings)
    {
        Model storage m = models[_modelId];
        if (m.ratingCount == 0) return (0, 0);
        return (m.ratingTotal / m.ratingCount, m.ratingCount);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  ACCESS CONTROL
    // ═══════════════════════════════════════════════════════════════════════════

    function grantAccess(uint256 _modelId, address _user)
        public onlyModelOwner(_modelId)
    {
        modelAccess[_modelId][_user] = true;
        emit AccessGranted(_modelId, _user);
    }

    function revokeAccess(uint256 _modelId, address _user)
        public onlyModelOwner(_modelId)
    {
        modelAccess[_modelId][_user] = false;
    }

    function hasAccess(uint256 _modelId, address _user)
        public view returns (bool)
    {
        return modelAccess[_modelId][_user] ||
               hasActiveSubscription(_user, _modelId);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  QUERY HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    function getJobsByBuyer(address _buyer)
        public view returns (uint256[] memory)
    { return jobsByBuyer[_buyer]; }

    function getJobsByModel(uint256 _modelId)
        public view returns (uint256[] memory)
    { return jobsByModel[_modelId]; }

    function getModelsByCreator(address _creator)
        public view returns (uint256[] memory)
    { return modelsByCreator[_creator]; }

    function getNodeCount() public view returns (uint256) {
        return nodeList.length;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  PLATFORM OWNER
    // ═══════════════════════════════════════════════════════════════════════════

    function withdrawPlatformFees() public onlyOwner {
        uint256 amount = platformFees;
        require(amount > 0, "No fees to withdraw");
        platformFees = 0;
        (bool ok, ) = platformOwner.call{value: amount}("");
        require(ok, "Withdrawal failed");
    }

    receive() external payable {}

    // ═══════════════════════════════════════════════════════════════════════════
    //  INTERNAL HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @dev Split an amount across all owners by their bps share.
     *      Any dust from integer division goes to platform fees.
     */
    function _distributeToOwners(uint256 _modelId, uint256 _amount) internal {
        Model storage m = models[_modelId];
        uint256 distributed;

        for (uint256 i = 0; i < m.ownerCount; i++) {
            uint256 ownerCut = (_amount * m.owners[i].shareBps) / 10000;
            distributed     += ownerCut;
            (bool ok, )      = m.owners[i].wallet.call{value: ownerCut}("");
            require(ok, "Owner payout failed");
        }

        // Dust from rounding goes to platform
        uint256 dust = _amount - distributed;
        if (dust > 0) platformFees += dust;
    }

    function _isModelOwner(uint256 _modelId, address _addr)
        internal view returns (bool)
    {
        Model storage m = models[_modelId];
        for (uint256 i = 0; i < m.ownerCount; i++) {
            if (m.owners[i].wallet == payable(_addr)) return true;
        }
        return false;
    }

    function _findOwnerIndex(uint256 _modelId, address _addr)
        internal view returns (uint256)
    {
        Model storage m = models[_modelId];
        for (uint256 i = 0; i < m.ownerCount; i++) {
            if (m.owners[i].wallet == payable(_addr)) return i;
        }
        revert("Owner not found");
    }
}
