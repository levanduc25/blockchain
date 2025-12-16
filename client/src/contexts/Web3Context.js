import React, { createContext, useState, useEffect, useContext } from 'react';
import Web3 from 'web3';
import VotingSystemContract from '../contracts/VotingSystem.json';

const Web3Context = createContext();

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider = ({ children }) => {
    const [web3, setWeb3] = useState(null);
    const [account, setAccount] = useState(null);
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initWeb3 = async () => {
            if (window.ethereum) {
                try {
                    const web3Instance = new Web3(window.ethereum);
                    setWeb3(web3Instance);

                    // Listen for account changes
                    window.ethereum.on('accountsChanged', (newAccounts) => {
                        setAccount(newAccounts[0] || null);
                    });

                    window.ethereum.on('chainChanged', () => {
                        window.location.reload();
                    });

                    // Check if already connected
                    const accounts = await web3Instance.eth.getAccounts();
                    if (accounts.length > 0) {
                        setAccount(accounts[0]);
                    }

                    // Generate contract instance
                    const networkId = await web3Instance.eth.net.getId();
                    const deployedNetwork = VotingSystemContract.networks[networkId];

                    if (deployedNetwork) {
                        const contractInstance = new web3Instance.eth.Contract(
                            VotingSystemContract.abi,
                            deployedNetwork.address,
                        );
                        setContract(contractInstance);
                    } else {
                        console.error('Contract not deployed to detected network.');
                        // Don't error blocking the UI, just maybe warn log
                    }

                } catch (err) {
                    console.error("Error initializing Web3", err);
                    setError("Failed to initialize Web3");
                }
            }
            setLoading(false);
        };

        initWeb3();
    }, []);

    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const web3Instance = new Web3(window.ethereum);
                const accounts = await web3Instance.eth.getAccounts();
                setAccount(accounts[0]);
            } catch (err) {
                console.error("User denied account access", err);
                throw err;
            }
        } else {
            alert("Please install MetaMask!");
        }
    };

    return (
        <Web3Context.Provider value={{ web3, account, contract, loading, error, connectWallet }}>
            {children}
        </Web3Context.Provider>
    );
};
