const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
});

// console.log('rl is this: ' + rl)
rl.prompt();
rl.on('line', (command)=>{
  // console.log(command)
  if(command === 'exit'){
    rl.close()
    return
  }
  console.log(`${command}: command not found`)
  rl.prompt()
})
