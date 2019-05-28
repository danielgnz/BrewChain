const express = require('express');
const bodyParser = require('body-parser');
const { BrewNode } = require('./BrewNode');

const PORT = 18070 + Math.floor(Math.random() * 30);

const firstNode = new BrewNode(PORT);
firstNode.init();

const HTTP_PORT = 3000 + Math.floor(Math.random() * 10);

const BrewHTTP = function(){
	const app = new express();

	app.use(bodyParser.json());

	app.get('/addNode/:port', (req, res) => {
		console.log(`Connecting node on port ${req.params.port} to node on port ${PORT}`);

		firstNode.addPeer('localhost', req.params.port);
		
		res.send("Success");
	}); 

	app.get('/spawnBrew/:teamMember', (req,res) => {
		firstNode.createBlock(req.params.teamMember);

		console.log('New block created');

		console.log('Total blocks in this node: ', firstNode.getStats());

		res.send("Success");
	});

	app.listen(http_port, () => {
		console.log(`HTTP Server is up on port ${http_port}`);
	});
}

BrewHTTP();