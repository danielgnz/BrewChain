const Crypto = require('crypto');

const BrewChain = function() {
	let chain = [];
	let currentBlock = {};
	let genesisBlock = {};

	const init = () => {
		genesisBlock = {
			index: 0,
			timestamp: 1511818270000,
			data: 'Our genesis data',
			previousHash: '-1',
			nonce: 0
		};

		genesisBlock.hash = createHash(genesisBlock);
		chain.push(genesisBlock);
		currentBlock = genesisBlock;
	}

	const createHash = ({ timestamp, data, index, previousHash, nonce }) => {
		return Crypto.createHash('SHA256')
					 .update(timestamp + data + index + previousHash + nonce)
					 .digest('hex');
	}

	const addToChain = (block) => {
		if(checkNewBlockIsValid(block, currentBlock)){
			chain.push(block);
			currentBlock = block;
			return true;	
		}
		return false;
	}

	const createBlock = (data) => {
		let newBlock = {
			index: currentBlock.index + 1,
			timestamp: new Date().getTime(),
			data: data,
			previousHash: currentBlock.hash,
			nonce: 0
		};
		
		newBlock = mineBlock(newBlock);

		return newBlock;
	}

	const mineBlock = (block) => {
		while(true){
			block.hash = createHash(block);
			if(block.hash.slice(0,3) === "000"){
				return block;
			}
			block.nonce++;
		}
	}

	const getLatestBlock = () => currentBlock;

	const getTotalBlocks = () => chain.length;

	const getChain = () => chain;

	const checkNewBlockIsValid = (block, previousBlock) => {
		if(previousBlock.index + 1 !== block.index) {
			// Invalid index
			return false;
		}
		else if (previousBlock.hash !== block.previousHash) {
			// The previous hash is incorrect
			return false;
		}
		else if (!hashIsValid(block)){
			// The hash is incorrect
			return false;
		}

		return true;
	}

	const hashIsValid = (block) => {
		return (createHash(block) === block.hash);
	}

	const checkNewChainIsValid = (newChain) => {
		if(createHash(newChain[0]) !== genesisBlock.hash){
			return false;
		}

		let previousBlock = newChain[0];
		let blockIndex = 1;

		while(blockIndex < newChain.length){
			let block = newChain[blockIndex];

			if(block.previousHash !== createHash(previousBlock)){
				return false;
			}

			if(block.hash.slice(0,3) !== '000'){
				return false;
			}

			previousBlock = block;
			blockIndex++;
		}

		return true;
	}

	const replaceChain = (newChain) => {
		chain = newChain;
		currentBlock = chain[chain.length - 1];
	}

	const toString = () => {
		console.log('chain', chain);
	}

	return {
		init,
		createBlock,
		addToChain,
		checkNewBlockIsValid,
		checkNewChainIsValid,
		getLatestBlock,
		getTotalBlocks,
		getChain,
		replaceChain,
		toString
	}
};

module.exports = {
	BrewChain
};