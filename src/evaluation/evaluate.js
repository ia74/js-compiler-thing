const {TokenType} = require("../Token.js");

let tokenStack;
function evaluate(tokens) {
  tokenStack = tokens;
  let lineCounter = 1;
  let printQueue = [];
  console.log(tokenStack)
  const variableDefinitions = {};
  while(tokenStack.length > 0) {
    const a = tokenStack.shift();
    if(a.type == TokenType.UNKNOWN_KEYWORD) {
      syntaxError("Unknown keyword " + a.value, -1);
    } else if(a.type == TokenType.COMMAND.SAY) {
      const output = tokenStack.shift();
      if(output.type == TokenType.EXECUTOR_OPEN) {
        let arguments = tokenStack.shift();
        while(arguments.type == TokenType.NONE) {arguments = tokenStack.shift()};
        if(arguments.type != TokenType.STRING_LITERAL_DOUBLE && arguments.type != TokenType.VARIABLE_ACCESSOR) {
          tokenStack.unshift(arguments);
          syntaxError("This executor requires a string literal.");
          return;
        }
        if(arguments.type == TokenType.VARIABLE_ACCESSOR) {
          const out = variableDefinitions[arguments.value];
          printQueue.push(out.value);
        } else {
          printQueue.push(arguments.value)
        } 
        let checkNext = tokenStack.shift();
        if(checkNext.type == TokenType.ARGUMENT_SEPARATOR) {
          let cToken = checkNext;
          while(cToken.type != TokenType.EXECUTOR_END) {
            cToken = tokenStack.shift();
            if(cToken.type == TokenType.EXECUTOR_END) {
              checkNextIsSemicolon();
              return;
            };
            if(cToken.type == TokenType.ARGUMENT_SEPARATOR) continue;
            while(cToken.type == TokenType.NONE) {cToken = tokenStack.shift()};
            if(cToken.type != TokenType.STRING_LITERAL_DOUBLE && cToken.type != TokenType.VARIABLE_ACCESSOR) {
              tokenStack.unshift(cToken);
              syntaxError("This executor requires a string literal. Found " +cToken.type);
              return;
            }
            if(cToken.type == TokenType.VARIABLE_ACCESSOR) {
              const out = variableDefinitions[cToken.value];
              printQueue.push(out);
            } else {
              printQueue.push(cToken.value)
            } 
            
          }
        }
        continue;
      }
      if(output.type != TokenType.STRING_LITERAL_DOUBLE) {
        tokenStack.unshift(output);
        syntaxError("Say requires a string literal.");
        return;
      }
      checkNextIsSemicolon();
      printQueue.push(output.value);
      console.log(printQueue)
    } else if(a.type == TokenType.SET_VARIABLE) {
      const next = tokenStack.shift();
      if(next.type != TokenType.EXECUTOR_OPEN) syntaxError("Set requires an executor. Try writing 'set(<variable>, <string>)'", -1);
      const input = tokenStack.shift();
      if(input.type != TokenType.VARIABLE_ACCESSOR) syntaxError("Not a variable", -1);

      const comma = tokenStack.shift();
      if(comma.type != TokenType.ARGUMENT_SEPARATOR) syntaxError("Too little arguments", -1);
      
      const value = tokenStack.shift();
      if(value.type != TokenType.STRING_LITERAL_DOUBLE) syntaxError("Need string literal", -1);
      
      const realNext = tokenStack.shift();
      if(realNext.type != TokenType.EXECUTOR_END) syntaxError("Too many arguments.", -1);
      checkNextIsSemicolon();
      variableDefinitions[input.value] = value.value;

    } else if(a.type == TokenType._exit) {
      const next = tokenStack.shift();
      if(next.type != TokenType.EXECUTOR_OPEN) syntaxError("Exit requires an executor. Try writing 'exit(<int>)'", -1);
      const input = tokenStack.shift();
      if(input.type != TokenType.INTEGER_LITERAL) syntaxError("Exit requires an exit code. Try writing 'exit(0)'", -1);
      const realNext = tokenStack.shift();
      if(realNext.type != TokenType.EXECUTOR_END) syntaxError("Too many arguments.", -1);
      process.exit(input.value)
    } else if(a.type == TokenType.COMMAND.FLUSH) {
        console.log("flush")
      console.log(printQueue);
      checkNextIsSemicolon();
    }

    if(a.type == TokenType.NEWLINE) lineCounter++;
  }
  function checkNextIsSemicolon() {
    const next = tokenStack.shift();
    if(next.type != TokenType.SEMICOLON_LIT) {
      tokenStack.unshift(next);
      trl();
    }
  }
  
  function trl() {
    syntaxError("Trailing statement - did you forget a ; ?");
  }
  
  function syntaxError(str, exitCode=null) {
    console.error(`Syntax error on line ${lineCounter}: ${str}`)
    if(exitCode != null) process.exit(exitCode);
  }
}

module.exports = {evaluate};