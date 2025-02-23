const TokenType = {
  COMMAND: {
    SAY: "print_buffer_push",
    FLUSH: "print_buffer_flush"
  },

  _exit: "[Exit]",
  SEMICOLON_LIT: ";",
  INTEGER_LITERAL: "[Integer]",
  NONE:"[None]",
  STRING_LITERAL_SINGLE: "'",
  STRING_LITERAL_DOUBLE: "\"",
  EXECUTOR_OPEN: "(",
  EXECUTOR_END: ")",
  ARGUMENT_SEPARATOR: ",",
  NEWLINE: "\n",
  UNKNOWN_KEYWORD: "[Unc]",
  SET_VARIABLE: "set",
  VARIABLE_ACCESSOR: "%(var)",
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
    return `Token{${this.type}}, "${this.value}"}`
  }
}

module.exports = { Token, TokenType };