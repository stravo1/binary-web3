import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import toast, { Toaster } from "react-hot-toast";
import Main from "./Main.jsx";
import Footer from "./Footer.jsx";
import useWallet from "../hooks/useWallet";
import contractAbi from "../abis/TheElevenPlatform.json";
import axios from "axios";
import ContestsEnrolledCards from "./ContestEnrolledCards.jsx";
import { View } from "lucide-react";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

export default function Profile() {
    const { account, balance, connectWallet, disconnectWallet } = useWallet();
    const [depositAmount, setDepositAmount] = useState("");
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [updatedBalance, setUpdatedBalance] = useState(balance);
    const [d11Balance, setD11Balance] = useState("0");
    const [contests, setContests] = useState([]);

    useEffect(() => {
        setUpdatedBalance(balance);
        if (account) fetchD11Balance();
    }, [balance, account]);

    const updateBalance = async () => {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const balanceWei = await provider.getBalance(account);
            setUpdatedBalance(ethers.formatEther(balanceWei));
            fetchD11Balance();
        } catch (error) {
            console.error("Failed to update balance", error);
        }
    };

    const fetchD11Balance = async () => {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(
                CONTRACT_ADDRESS,
                contractAbi,
                provider
            );
            const balance = await contract.d11Balance(account);
            setD11Balance(ethers.formatUnits(balance, 18));
        } catch (error) {
            console.error("Failed to fetch d11 balance", error);
        }
    };

    useEffect(() => {
        async function getAllContests() {
            const options = {
                method: "GET",
                url: `${import.meta.env.VITE_BASE_URL || "http://localhost:3000/api"}/ipl/contests/all-contest?userId=8`,
            };

            try {
                const { data } = await axios.request(options);
                // console.log(data.data.contests.UPCOMING);
                setContests(data.data.contests.UPCOMING);
            } catch (error) {
                console.error(error);
            }
        }
        getAllContests();
    }, []); // Empty dependency array added

    const handleDeposit = async () => {
        if (!account) return toast.error("Please connect your wallet first");
        if (
            !depositAmount ||
            isNaN(Number(depositAmount)) ||
            Number(depositAmount) <= 0
        ) {
            return toast.error("Enter a valid deposit amount");
        }
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(
                CONTRACT_ADDRESS,
                contractAbi,
                signer
            );
            const tx = await contract.deposit({
                value: ethers.parseEther(depositAmount),
            });
            await tx.wait();
            toast.success("Deposit successful!");
            setDepositAmount("");
            updateBalance();
        } catch (error) {
            console.error("Deposit failed", error);
            toast.error("Transaction failed");
        }
    };

    const handleWithdraw = async () => {
        if (!account) return toast.error("Please connect your wallet first");
        if (
            !withdrawAmount ||
            isNaN(Number(withdrawAmount)) ||
            Number(withdrawAmount) <= 0
        ) {
            return toast.error("Enter a valid withdraw amount");
        }
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(
                CONTRACT_ADDRESS,
                contractAbi,
                signer
            );
            const tx = await contract.withdraw(
                ethers.parseUnits(withdrawAmount, 18)
            );
            await tx.wait();
            toast.success("Withdrawal successful!");
            setWithdrawAmount("");
            updateBalance();
        } catch (error) {
            console.error("Withdrawal failed", error);
            toast.error("Transaction failed");
        }
    };

    return (
        <Main>
            <div className="h-full w-full bg-white relative">
                <header className="bg-gray-100 text-gray-800 p-4 flex justify-between items-center shadow-md rounded-lg w-full max-w-4xl mx-auto">
                    <h1 className="text-lg font-semibold">TheEleven</h1>
                    {account ? (
                        <div className="bg-gray-200 p-2 rounded-lg shadow-sm text-center">
                            <p className="text-sm text-gray-700">
                                💰{" "}
                                {updatedBalance
                                    ? parseFloat(updatedBalance).toFixed(4)
                                    : "0.0000"}{" "}
                                AVAX
                            </p>
                            <p className="text-sm text-gray-700">
                                🔗 {account.substring(0, 4)}...
                                {account.slice(-4)}
                            </p>
                            <button
                                onClick={disconnectWallet}
                                className="bg-gray-700 text-white px-3 py-1 text-sm rounded-md hover:bg-gray-800 transition mt-2 w-full"
                            >
                                Disconnect
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={connectWallet}
                            className="bg-gray-700 text-white px-4 py-2 text-sm rounded-md hover:bg-gray-800 transition"
                        >
                            Connect Wallet
                        </button>
                    )}
                </header>
                <div className="flex flex-col items-center justify-center p-6 h-[70vh] overflow-y-scroll">
                    <Toaster />
                    <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-md border border-gray-300 mt-[40vh]">
                        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
                            Profile
                        </h2>
                        {account ? (
                            <div className="mt-6 text-center space-y-4">
                                <p className="text-lg text-gray-700">
                                    Your AVAX Balance:{" "}
                                    <span className="font-bold">
                                        {updatedBalance
                                            ? parseFloat(
                                                  updatedBalance
                                              ).toFixed(4)
                                            : "0.0000"}{" "}
                                        AVAX
                                    </span>
                                </p>
                                <p className="text-lg text-gray-700">
                                    Your d11 Balance:{" "}
                                    <span className="font-bold">
                                        {d11Balance}
                                    </span>
                                </p>
                                <input
                                    type="number"
                                    value={depositAmount}
                                    onChange={(e) =>
                                        setDepositAmount(e.target.value)
                                    }
                                    className="w-full px-4 py-3 text-gray-900 rounded-lg border border-gray-400 focus:ring-2 focus:ring-gray-600 outline-none bg-gray-200 placeholder-gray-500"
                                    placeholder="Enter AVAX amount"
                                />
                                <button
                                    onClick={handleDeposit}
                                    className="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white transition-all text-lg font-semibold rounded-xl shadow-md"
                                >
                                    Deposit AVAX
                                </button>
                                <input
                                    type="number"
                                    value={withdrawAmount}
                                    onChange={(e) =>
                                        setWithdrawAmount(e.target.value)
                                    }
                                    className="w-full px-4 py-3 text-gray-900 rounded-lg border border-gray-400 focus:ring-2 focus:ring-gray-600 outline-none bg-gray-200 placeholder-gray-500 mt-4"
                                    placeholder="Enter AVAX amount to withdraw"
                                />
                                <button
                                    onClick={handleWithdraw}
                                    className="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white transition-all text-lg font-semibold rounded-xl shadow-md"
                                >
                                    Withdraw AVAX
                                </button>
                            </div>
                        ) : (
                            <p className="text-lg text-gray-700 text-center">
                                Connect your wallet to view your profile.
                            </p>
                        )}
                    </div>
                    <div className="w-full h-[50vh] max-w-lg bg-white rounded-2xl shadow-md border border-gray-300 mt-6 space-y-4">
                        {contests.map((data) => (
                            <ContestsEnrolledCards
                                contest={data.contest}
                                match={data.match}
                                key={data.contest.contestId}
                            />
                        ))}
                    </div>
                </div>
                <Footer />
            </div>
        </Main>
    );
}
