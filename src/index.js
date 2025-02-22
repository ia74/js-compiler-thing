const fs = require('fs');

const fileIn = fs.readFileSync(process.argv[2], 'utf-8').toString();

let buffer = "";

function isAlphanumeric (e) {
  if(e == undefined) return;
  return e.match(/[A-Za-z]/g) != null;
}
function isNumeric(e) {
  if(e == undefined) return;
  return e.match(/[0-9]/g) != null;
}
function isSpace (e) {
  if(e == undefined) return;
  return  e.match(/\s/g) != null;
}

const TokenType = {
  COMMAND: {
    SAY: "<Say>"
  },

  _exit: "[Exit]",
  SEMICOLON_LIT: "[Semicolon]",
  INTEGER_LITERAL: "[Integer]",
  NONE:"[None]",
  STRING_LITERAL_SINGLE: "[StringLiteral']",
  STRING_LITERAL_DOUBLE: "[StringLiteral\"]",
  EXECUTOR_OPEN: "[Executor]",
  EXECUTOR_END: "[ExecutorEnd]",
  ARGUMENT_SEPARATOR: "[Separator]",
  NEWLINE: "[Newline]",
  UNKNOWN_KEYWORD: "[Unc]",
}

class Token {
  type;
  value;
  constructor(type, value=null) {
    this.type = type;
    this.value = value;
  }
  setType(type) {
    this.type = type;
  }
  setValue(value) {
    this.value = value;
  }
  evaluate(func) {
    return func({type, value});
  }
  toString() {
    return `Token{${Object.keys(TokenType[type])}, "${value}"}`
  }
}

function tokenize(fileIn, count=-1) {
  const tokenStack = [];
  let initialLiteral = -2;
  while(fileIn.length - 1 > count++) {
    let char = fileIn.at(count);
    let token = new Token(TokenType.NONE)
  
    if(isAlphanumeric(char)) {
      buffer += char;
      count++;
      while(isAlphanumeric(char) && !isSpace(char)) {
        char = fileIn.at(count);
        if(!isAlphanumeric(char) || isSpace(char)) break;

        count++;
        buffer += char;
      }
      count--;
      buffer = buffer.trim()

      if(buffer == "exit") {
        token.setType(TokenType._exit);
      } else if(buffer == "say") {
        token.setType(TokenType.COMMAND.SAY);
      } else if(buffer == ";") {
        token.setType(TokenType.SEMICOLON_LIT);
      } else {
        token.setType(TokenType.UNKNOWN_KEYWORD);
        token.setValue(buffer);
      }
      buffer = "";
    } else 
    
    
    if(initialLiteral != count && char.match(/\"/g) || char.match(/\'/g)) {
      initialLiteral = count;
      let type = char.match(/\"/g) ? TokenType.STRING_LITERAL_DOUBLE : TokenType.STRING_LITERAL_SINGLE;
      count++;
      char = fileIn.at(count);
      while(isAlphanumeric(char) || isNumeric(char) || isSpace(char)) {
        buffer += char;
        count++;
        char = fileIn.at(count);
      }
      token.setType(type);
      token.setValue(buffer);
      // just in case
      if(buffer.includes("\"")) {
        const substr = buffer.split("\"");
        token.setValue(substr[substr.length-1]);
      }
      buffer="";
    } 
    
    
    else if(char.match(/\(/g)) {
      token.setType(TokenType.EXECUTOR_OPEN);
      count++;
      char = fileIn.at(count);
      while(char != ")") {
        count++;
        buffer += char;
        char = fileIn.at(count);
      }
      count--;
      tokenStack.push(token);
      const e =tokenize(buffer.split(""))
      tokenStack.push(...e);
      continue;
    } else if(char == ')') {
      token.setType(TokenType.EXECUTOR_END);
    } else if(char == ',') {
      token.setType(TokenType.ARGUMENT_SEPARATOR);
    } else if(char == ";") {
      token.setType(TokenType.SEMICOLON_LIT);
      buffer="";
    } else if(char == "\n") {
      token.setType(TokenType.NEWLINE);
      buffer = "";
    } else if(isNumeric(char)) {
      count++;
      char = fileIn.at(count);
      while(isNumeric(char)) {
        count++;
        buffer += char;
        char = fileIn.at(count);
      }
      count--;
      token.setType(TokenType.INTEGER_LITERAL);
      token.setValue(buffer);
    } else if(isSpace(char)) continue;
    tokenStack.push(token);
  }
  return tokenStack;
}

const tokenStack = tokenize(fileIn);

let lineCounter = 1;
while(tokenStack.length > 0) {
  const a = tokenStack.shift();
  if(a.type == TokenType.UNKNOWN_KEYWORD) {
    syntaxError("Unknown keyword " + a.value, -1);
  } else if(a.type == TokenType.COMMAND.SAY) {
    const output = tokenStack.shift();
    if(output.type == TokenType.EXECUTOR_OPEN) {
      let arguments = tokenStack.shift();
      while(arguments.type == TokenType.NONE) {arguments = tokenStack.shift()};
      if(arguments.type != TokenType.STRING_LITERAL_DOUBLE) {
        tokenStack.unshift(arguments);
        syntaxError("This executor requires a string literal.");
        return;
      }
      console.log(arguments.value)
      let checkNext = tokenStack.shift();
      if(checkNext.type == TokenType.ARGUMENT_SEPARATOR) {
        let cToken = checkNext;
        while(cToken.type != TokenType.EXECUTOR_END) {
          cToken = tokenStack.shift();
          if(cToken.type == TokenType.EXECUTOR_END) {
            checkNextIsSemicolon();
            break;
          };
          while(cToken.type == TokenType.NONE) {cToken = tokenStack.shift()};
          if(cToken.type != TokenType.STRING_LITERAL_DOUBLE && cToken.type != TokenType.ARGUMENT_SEPARATOR) {
            tokenStack.unshift(cToken);
            syntaxError("This executor requires a string literal.");
            return;
          }
          if(cToken.type == TokenType.STRING_LITERAL_DOUBLE) {
            console.log(cToken.value)
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
    console.log(output.value);
  }

  if(a.type == TokenType._exit) {
    const next = tokenStack.shift();
    if(next.type != TokenType.EXECUTOR_OPEN) syntaxError("Exit requires an executor. Try writing 'exit(<int>)'", -1);
    const input = tokenStack.shift();
    if(input.type != TokenType.INTEGER_LITERAL) syntaxError("Exit requires an exit code. Try writing 'exit(0)'", -1);
    const realNext = tokenStack.shift();
    if(realNext.type != TokenType.EXECUTOR_END) syntaxError("Too many arguments.", -1);
    process.exit(input.value)
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
