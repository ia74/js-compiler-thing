const {Token, TokenType} = require("./Token.js");

function isAlphanumeric (e) {
  if(e == undefined) return;
  return e.match(/[A-Za-z_]/g) != null;
}
function isNumeric(e) {
  if(e == undefined) return;
  return e.match(/[0-9]/g) != null;
}
function isSpace (e) {
  if(e == undefined) return;
  return  e.match(/\s/g) != null;
}

function tokenize(fileIn, count=-1) {
  const tokenStack = [];
  let initialLiteral = -2;
  let buffer = "";
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
      } else if(buffer == "print_buffer_flush") {
        token.setType(TokenType.COMMAND.FLUSH);
      } else if(buffer == "print_buffer_push") {
        token.setType(TokenType.COMMAND.SAY);
      } else if(buffer == ";") {
        token.setType(TokenType.SEMICOLON_LIT);
      } else if(buffer == "set") {
        token.setType(TokenType.SET_VARIABLE);
      }
      
      else {
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
      char = fileIn.at(count);
      count++;
      while(isNumeric(char)) {
        count++;
        buffer += char;
        char = fileIn.at(count);
      }
      count--;
      token.setType(TokenType.INTEGER_LITERAL);
      token.setValue(buffer);
    } else if(char == "%") {
      count++;
      char = fileIn.at(count);
      while((isAlphanumeric(char) || isNumeric(char) || isSpace(char)) && char.trim() != "") {
        buffer += char;
        count++;
        char = fileIn.at(count);
      }
      count--;
      buffer = buffer.trim();
      token.setType(TokenType.VARIABLE_ACCESSOR);
      token.setValue(buffer);
      buffer="";
    } else if(isSpace(char)) continue;
    tokenStack.push(token);
  }
  return tokenStack;
}

module.exports = {tokenize};