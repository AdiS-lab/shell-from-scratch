const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
});


// console.log('rl is this: ' + rl)

const validCommands = ['echo', 'exit', 'type']
const PATH= process.env.PATH
rl.prompt();
rl.on('line', (command)=>{
  // console.log(typeof command)
  if(command === 'exit'){
    rl.close()
    return
  }
  else if(command.startsWith("echo")){
    console.log(`${command.slice(5)}`)
  }
  else if(command?.startsWith('type')){
    const secondHalf = command.slice(5)
    const directories = PATH.split(':')
    if(secondHalf){
      if (validCommands.includes(secondHalf)) {console.log(`${secondHalf} is a shell builtin`)}
      else{
        directories.forEach((path, index) => {
        const files = path.split('/')
          if(files.includes(secondHalf)){
            console.log(`${secondHalf} is ${directories[index]}`)
            return
          }
        })
        console.log(`${secondHalf}: not found`)
      } 
    }
    }
    else{
      console.log(`${command}: command not found`)
    }
  rl.prompt()
})
