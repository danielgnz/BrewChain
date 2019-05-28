const WebSocket = require('ws');
const { BrewChain } = require('./BrewChain');

const { BLOCK, REQUEST_CHAIN, CHAIN, REQUEST_BLOCK } = require('./constants');

const BrewNode = function(port){
	let brewSockets = [];
	let brewServer;
	let _port = port;
	let chain = new BrewChain();

	const init = () => {
		chain.init();
		console.log(`Starting node on port: ${_port}`);

		brewServer = new WebSocket.Server({ port: _port });

		brewServer.on('connection', (connection) => {
			console.log('Connected');
			initConnection(connection);
		});
	}

	const initConnection = (connection) => {
		console.log('Initializing connection...');

		messageHandler(connection);
		requestLatestBlock(connection);
		brewSockets.push(connection);

		connection.on('error', () => closeConnection(connection));
		connection.on('close', () => closeConnection(connection));
	}

	const closeConnection = (connection) => {
		console.log('Closing connection...');
		brewSockets.splice(brewSockets.indexOf(connection), 1);
	}

	const broadcastMessage = (type, message) => {
		console.log(`Sending a ${type} message to all...`);
		brewSockets.forEach(node => node.send(JSON.stringify({type, message})));
	}

	const messageHandler = (connection) => {
		connection.on('message', (data) => {
			const msg = JSON.parse(data);
			switch(msg.type){
				case REQUEST_CHAIN:
					requestChain(connection); break;
				case BLOCK:
					processReceivedBlock(msg.message); break;
				case CHAIN:
					processReceivedChain(msg.message); break;
				case REQUEST_BLOCK:
					requestLatestBlock(connection); break;
				default:
					console.log('Unknown Message Type');
			}
		});
	}

	const createBlock = (teamMember) => {
		let newBlock = chain.createBlock(teamMember);
		
		chain.addToChain(newBlock);

		broadcastMessage(BLOCK, newBlock);
	}

	const addPeer = (host, port) => {
		let connection = new WebSocket(`ws://${host}:${port}`);

		connection.on('error', (error) => {
			console.log(error);
		});

		connection.on('open', (msg) => {
			initConnection(connection);
		});
	}

	const processReceivedBlock = (block) => {
		let currentTopBlock = chain.getLatestBlock();

		// Is the same or older?
		if(block.index <= currentTopBlock){
			console.log("No update needed");
			return;
		}

		// Is claiming to be the next in the chain
		if(block.previousHash === currentTopBlock.hash){
			chain.addToChain(block);

			console.log('New block has been added');
			console.log(chain.getLatestBlock());
		}
		else {
			// It is ahead.. therefore, request the whole chain

			console.log('Requesting chain...');
			broadcastMessage(REQUEST_CHAIN, "");
		}
	}

	const processReceivedChain = (blocks) => {
		const newChain = blocks.sort((block1, block2) => (block1.index - block2.index));
		
		if(newChain.length > chain.getTotalBlocks() && chain.checkNewChainIsValid(newChain)){
			chain.replaceChain(newChain);
			console.log('Chain replaced');
		}
	}

	const requestChain = (connection) => {
		return connection.send(JSON.stringify({ type: CHAIN, message: chain.getChain()}));
	}

	const requestLatestBlock = (connection) => {
		connection.send(JSON.stringify({ type: BLOCK, message: chain.getLatestBlock()}));
	}

	const getStats = () => {
		return {
			blocks: chain.getTotalBlocks()
		}
	}

	return {
		init,
		broadcastMessage,
		addPeer,
		createBlock,
		getStats
	}
}

module.exports = {
	BrewNode
}