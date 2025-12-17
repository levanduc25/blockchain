// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VotingSystem {
    // Struct để lưu thông tin ứng viên
    struct Candidate {
        uint256 id;
        string name;
        string party;
        uint256 voteCount;
        bool isVerified;
    }

    // Struct để lưu thông tin cử tri
    struct Voter {
        bool isRegistered;
        bool isVerified;
        bool hasVoted;
        uint256 votedCandidateId;
    }

    // Enum trạng thái cuộc bỏ phiếu
    enum ElectionState {
        Registration, // Đăng ký cử tri và ứng viên
        Voting, // Đang bỏ phiếu
        Ended // Kết thúc
    }

    // State variables
    address public admin;
    ElectionState public electionState;
    uint256 public candidateCount;
    uint256 public totalVotes;

    // Mappings
    mapping(address => Voter) public voters;
    mapping(uint256 => Candidate) public candidates;

    // Events
    event CandidateAdded(
        uint256 indexed candidateId,
        string name,
        string party
    );
    event CandidateVerified(uint256 indexed candidateId);
    event VoterRegistered(address indexed voterAddress);
    event VoterVerified(address indexed voterAddress);
    event VoteCasted(address indexed voter, uint256 indexed candidateId);
    event ElectionStateChanged(ElectionState newState);

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier inState(ElectionState _state) {
        require(electionState == _state, "Invalid election state");
        _;
    }

    constructor() {
        admin = msg.sender;
        electionState = ElectionState.Registration;
        candidateCount = 0;
        totalVotes = 0;
    }

    // ============ ADMIN FUNCTIONS ============

    // Thêm ứng viên (chỉ admin)
    function addCandidate(
        string memory _name,
        string memory _party
    ) public onlyAdmin inState(ElectionState.Registration) {
        require(bytes(_name).length > 0, "Candidate name cannot be empty");
        require(bytes(_party).length > 0, "Party name cannot be empty");

        candidateCount++;
        candidates[candidateCount] = Candidate({
            id: candidateCount,
            name: _name,
            party: _party,
            voteCount: 0,
            isVerified: false
        });

        emit CandidateAdded(candidateCount, _name, _party);
    }

    // Xác thực ứng viên
    function verifyCandidate(
        uint256 _candidateId
    ) public onlyAdmin inState(ElectionState.Registration) {
        require(
            _candidateId > 0 && _candidateId <= candidateCount,
            "Invalid candidate ID"
        );
        require(
            !candidates[_candidateId].isVerified,
            "Candidate already verified"
        );

        candidates[_candidateId].isVerified = true;
        emit CandidateVerified(_candidateId);
    }

    // Xác thực cử tri
    function verifyVoter(address _voterAddress) public onlyAdmin {
        require(voters[_voterAddress].isRegistered, "Voter is not registered");
        require(!voters[_voterAddress].isVerified, "Voter already verified");

        voters[_voterAddress].isVerified = true;
        emit VoterVerified(_voterAddress);
    }

    // Chuyển đổi trạng thái cuộc bỏ phiếu
    function changeElectionState(ElectionState _newState) public onlyAdmin {
        require(_newState != electionState, "Already in this state");

        // Validate state transitions
        if (_newState == ElectionState.Voting) {
            require(
                electionState == ElectionState.Registration,
                "Can only start voting from registration"
            );
            require(
                candidateCount > 0,
                "Need at least one candidate to start voting"
            );
        } else if (_newState == ElectionState.Ended) {
            require(
                electionState == ElectionState.Voting,
                "Can only end from voting state"
            );
        }

        electionState = _newState;
        emit ElectionStateChanged(_newState);
    }

    // ============ VOTER FUNCTIONS ============

    // Đăng ký cử tri
    function registerVoter() public inState(ElectionState.Registration) {
        require(!voters[msg.sender].isRegistered, "Voter already registered");

        voters[msg.sender] = Voter({
            isRegistered: true,
            isVerified: false,
            hasVoted: false,
            votedCandidateId: 0
        });

        emit VoterRegistered(msg.sender);
    }

    // Bỏ phiếu
    function vote(uint256 _candidateId) public payable inState(ElectionState.Voting) {
        require(voters[msg.sender].isRegistered, "You are not registered");
        require(voters[msg.sender].isVerified, "You are not verified");
        require(!voters[msg.sender].hasVoted, "You have already voted");
        require(msg.value > 0, "Must send ETH to vote");
        require(
            _candidateId > 0 && _candidateId <= candidateCount,
            "Invalid candidate ID"
        );
        require(
            candidates[_candidateId].isVerified,
            "Candidate is not verified"
        );

        voters[msg.sender].hasVoted = true;
        voters[msg.sender].votedCandidateId = _candidateId;

        candidates[_candidateId].voteCount++;
        totalVotes++;

        emit VoteCasted(msg.sender, _candidateId);
    }

    // ============ VIEW FUNCTIONS ============

    // Lấy thông tin ứng viên
    function getCandidate(
        uint256 _candidateId
    )
        public
        view
        returns (
            uint256 id,
            string memory name,
            string memory party,
            uint256 voteCount,
            bool isVerified
        )
    {
        require(
            _candidateId > 0 && _candidateId <= candidateCount,
            "Invalid candidate ID"
        );
        Candidate memory c = candidates[_candidateId];
        return (c.id, c.name, c.party, c.voteCount, c.isVerified);
    }

    // Lấy tất cả ứng viên
    function getAllCandidates() public view returns (Candidate[] memory) {
        Candidate[] memory allCandidates = new Candidate[](candidateCount);
        for (uint256 i = 1; i <= candidateCount; i++) {
            allCandidates[i - 1] = candidates[i];
        }
        return allCandidates;
    }

    // Lấy thông tin cử tri
    function getVoter(
        address _voterAddress
    )
        public
        view
        returns (
            bool isRegistered,
            bool isVerified,
            bool hasVoted,
            uint256 votedCandidateId
        )
    {
        Voter memory v = voters[_voterAddress];
        return (v.isRegistered, v.isVerified, v.hasVoted, v.votedCandidateId);
    }

    // Kiểm tra xem address có phải admin không
    function isAdmin(address _address) public view returns (bool) {
        return _address == admin;
    }

    // Lấy kết quả bỏ phiếu (chỉ khi đã kết thúc hoặc đang voting)
    function getResults() public view returns (Candidate[] memory) {
        require(
            electionState == ElectionState.Voting ||
                electionState == ElectionState.Ended,
            "Results not available yet"
        );
        return getAllCandidates();
    }

    // Lấy người chiến thắng
    function getWinner()
        public
        view
        inState(ElectionState.Ended)
        returns (
            uint256 id,
            string memory name,
            string memory party,
            uint256 voteCount
        )
    {
        require(candidateCount > 0, "No candidates");

        uint256 winningVoteCount = 0;
        uint256 winningCandidateId = 0;

        for (uint256 i = 1; i <= candidateCount; i++) {
            if (candidates[i].voteCount > winningVoteCount) {
                winningVoteCount = candidates[i].voteCount;
                winningCandidateId = i;
            }
        }

        require(winningCandidateId > 0, "No winner found");
        Candidate memory winner = candidates[winningCandidateId];
        return (winner.id, winner.name, winner.party, winner.voteCount);
    }
}
