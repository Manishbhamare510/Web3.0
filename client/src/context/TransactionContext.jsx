import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { contractABI, contractAddress } from "../utils/constants";

export const TransactionContext = React.createContext();

const { ethereum } = window;

const getEthereumContract = () => {
  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  const transactionsContract = new ethers.Contract(
    contractAddress,
    contractABI,
    signer
  );

  return transactionsContract;
};

export const TransactionProvider = ({ children }) => {
  const [connectedAccount, setConnectedAccount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    addressTo: "",
    amount: "",
    keyword: "",
    message: "",
  });
  const [transactions, setTransactions] = useState([]);
  const [transactionCount, setTransactionCount] = useState(
    localStorage.getItem("transactionCount")
  );

  const handleChange = (e, name) => {
    setFormData((prevState) => ({ ...prevState, [name]: e.target.value }));
  };

  const getAllTransactions = async () => {
    try {
      if (!ethereum) {
        return alert("Please install Metamask");
      }
      const transactionContract = getEthereumContract();
      const availableTransactions =
        await transactionContract.getAllTransactions();

      const structuredTransactions = availableTransactions.map(
        (transaction) => ({
          addressTo: transaction.receiver,
          addressFrom: transaction.sender,
          timestamp: new Date(
            transaction.timestamp.toNumber() * 1000
          ).toLocaleString(),
          message: transaction.message,
          keyword: transaction.keyword,
          ammount: parseInt(transaction.amount._hex) / 10 ** 18,
        })
      );
      setTransactions(structuredTransactions);
      console.log(structuredTransactions);
    } catch (error) {
      console.log(error);
    }
  };
  const checkIfWalletConnected = async () => {
    try {
      if (!ethereum) {
        return alert("Please install Metamask");
      }
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length) {
        setConnectedAccount(accounts[0]);
        getAllTransactions();
      } else {
        console.log("No Accounts found");
      }
      console.log(accounts);
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfTrasactionsExist = async () => {
    try {
      if (ethereum) {
        const transactionContract = getEthereumContract();
        const transactionsCount =
          await transactionContract.getTransactionCount();

        window.localStorage.setItem("transactionCount", transactionsCount);
      }
    } catch (error) {
      console.log(error);
      throw new Error("No Ethereum Object");
    }
  };

  const connectWallet = async () => {
    try {
      if (!ethereum) {
        return alert("Please install Metamask");
      }
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      setConnectedAccount(accounts[0]);
    } catch (error) {
      console.log(error);
      throw new Error("No Ethereum Object");
    }
  };
  const sendTransaction = async () => {
    try {
      if (!ethereum) {
        return alert("Please install Metamask");
      }
      const { addressTo, amount, keyword, message } = formData;
      const transactionContract = getEthereumContract();
      const parsedAmount = ethers.utils.parseEther(amount);

      await ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: connectedAccount,
            to: addressTo,
            gas: "0x5208",
            value: parsedAmount._hex,
          },
        ],
      });

      const transactionHash = await transactionContract.addToBlockchain(
        addressTo,
        parsedAmount,
        message,
        keyword
      );

      setIsLoading(true);
      console.log(`Loading : ${transactionHash.hash}`);
      await transactionHash.wait();

      setIsLoading(false);
      console.log(`Success : ${transactionHash.hash}`);

      const transactionsCount = await transactionContract.getTransactionCount();
      setTransactionCount(transactionsCount.toNumber());
    } catch (error) {
      console.log(error);
      throw new Error("No Ethereum Object");
    }
  };
  useEffect(() => {
    checkIfWalletConnected();
    checkIfTrasactionsExist();
  }, [transactionCount]);
  return (
    <TransactionContext.Provider
      value={{
        connectWallet,
        connectedAccount,
        formData,
        sendTransaction,
        handleChange,
        transactions,
        isLoading,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
