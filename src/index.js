const {tokenize} = require("./tokenizer.js");
const {evaluate} = require("./evaluation/evaluate.js");

const fs = require('fs');
const fileIn = fs.readFileSync(process.argv[2], 'utf-8').toString();

const tokenStack = tokenize(fileIn);

evaluate(tokenStack);